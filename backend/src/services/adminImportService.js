const db = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');

const ALLOWED_IMPORT_TYPES = ['employees', 'teams', 'projects', 'team_members'];
const ALLOWED_ROLES = ['admin', 'team_lead', 'member'];
const ALLOWED_BOARD_TYPES = ['scrum', 'kanban'];

const REQUIRED_COLUMNS = {
  employees: ['email', 'password', 'first_name', 'last_name'],
  teams: ['name'],
  projects: ['name', 'key_code'],
  team_members: []
};

const SAMPLE_COLUMNS = {
  employees: ['email', 'password', 'first_name', 'last_name', 'role'],
  teams: ['name', 'description', 'team_lead_email'],
  projects: ['name', 'key_code', 'description', 'team_id', 'team_name', 'board_type', 'start_date', 'end_date'],
  team_members: ['team_id', 'team_name', 'user_id', 'user_email', 'is_team_lead']
};

const toBool = (value) => {
  if (typeof value === 'boolean') {
    return value;
  }
  const raw = String(value || '').trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes' || raw === 'y';
};

const normalizeHeader = (header) => String(header || '').trim().toLowerCase();

const parseCsvLine = (line) => {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];

    if (char === '"') {
      const next = line[i + 1];
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

const parseCsv = (raw) => {
  const text = String(raw || '').replace(/^\uFEFF/, '');
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    throw { statusCode: 400, message: 'CSV must include header and at least one data row.' };
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);
  if (headers.some((h) => !h)) {
    throw { statusCode: 400, message: 'CSV contains empty column names.' };
  }

  const rows = lines.slice(1).map((line) => {
    const cells = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = (cells[index] || '').trim();
    });
    return row;
  });

  return { headers, rows };
};

const getValue = (row, keys) => {
  for (const key of keys) {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return String(value).trim();
    }
  }
  return '';
};

const assertRequiredColumns = (headers, importType) => {
  const required = REQUIRED_COLUMNS[importType] || [];
  const missing = required.filter((col) => !headers.includes(col));
  if (missing.length > 0) {
    throw {
      statusCode: 400,
      message: `CSV missing required columns for ${importType}: ${missing.join(', ')}`
    };
  }
};

class AdminImportService {
  static getSupportedImportTypes() {
    return ALLOWED_IMPORT_TYPES;
  }

  static getTemplateColumns() {
    return SAMPLE_COLUMNS;
  }

  static async importCsv({ importType, csvBuffer, createdBy }) {
    if (!ALLOWED_IMPORT_TYPES.includes(importType)) {
      throw {
        statusCode: 400,
        message: `Invalid import_type. Allowed values: ${ALLOWED_IMPORT_TYPES.join(', ')}`
      };
    }

    const { headers, rows } = parseCsv(csvBuffer.toString('utf-8'));
    assertRequiredColumns(headers, importType);

    const result = {
      importType,
      totalRows: rows.length,
      created: 0,
      skipped: 0,
      failed: 0,
      errors: []
    };

    const connection = await db.getConnection();
    try {
      for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index];
        const rowNumber = index + 2;

        try {
          await connection.beginTransaction();
          const action = await this.processRow(importType, row, createdBy, connection);
          await connection.commit();

          if (action === 'created') {
            result.created += 1;
          } else {
            result.skipped += 1;
          }
        } catch (error) {
          await connection.rollback();
          result.failed += 1;
          result.errors.push({
            row: rowNumber,
            reason: error.message || 'Failed to process row'
          });
        }
      }
    } finally {
      connection.release();
    }

    return result;
  }

  static async processRow(importType, row, createdBy, connection) {
    if (importType === 'employees') {
      return this.processEmployeeRow(row, connection);
    }
    if (importType === 'teams') {
      return this.processTeamRow(row, connection);
    }
    if (importType === 'projects') {
      return this.processProjectRow(row, createdBy, connection);
    }
    return this.processTeamMemberRow(row, connection);
  }

  static async processEmployeeRow(row, connection) {
    const email = getValue(row, ['email']).toLowerCase();
    const password = getValue(row, ['password']);
    const firstName = getValue(row, ['first_name', 'firstname', 'first name']);
    const lastName = getValue(row, ['last_name', 'lastname', 'last name']);
    const roleRaw = getValue(row, ['role']).toLowerCase();
    const role = ALLOWED_ROLES.includes(roleRaw) ? roleRaw : 'member';

    if (!email || !password || !firstName || !lastName) {
      throw new Error('Missing required employee columns: email, password, first_name, last_name');
    }

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (existing.length > 0) {
      return 'skipped';
    }

    const hashedPassword = await hashPassword(password);
    await connection.query(
      'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
      [email, hashedPassword, firstName, lastName, role]
    );

    return 'created';
  }

  static async resolveUserId(row, connection) {
    const userIdRaw = getValue(row, ['user_id', 'team_lead_id']);
    if (userIdRaw) {
      const userId = Number(userIdRaw);
      if (!Number.isInteger(userId)) {
        throw new Error('Invalid user_id');
      }
      const [users] = await connection.query('SELECT id FROM users WHERE id = ? LIMIT 1', [userId]);
      if (users.length === 0) {
        throw new Error('User not found');
      }
      return userId;
    }

    const userEmail = getValue(row, ['user_email', 'team_lead_email', 'email']).toLowerCase();
    if (!userEmail) {
      return null;
    }
    const [users] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [userEmail]);
    if (users.length === 0) {
      throw new Error(`User not found for email: ${userEmail}`);
    }
    return users[0].id;
  }

  static async resolveTeamId(row, connection) {
    const teamIdRaw = getValue(row, ['team_id']);
    if (teamIdRaw) {
      const teamId = Number(teamIdRaw);
      if (!Number.isInteger(teamId)) {
        throw new Error('Invalid team_id');
      }
      const [teams] = await connection.query('SELECT id FROM teams WHERE id = ? LIMIT 1', [teamId]);
      if (teams.length === 0) {
        throw new Error('Team not found');
      }
      return teamId;
    }

    const teamName = getValue(row, ['team_name', 'team']);
    if (!teamName) {
      throw new Error('team_id or team_name is required');
    }
    const [teams] = await connection.query('SELECT id FROM teams WHERE name = ? LIMIT 1', [teamName]);
    if (teams.length === 0) {
      throw new Error(`Team not found for name: ${teamName}`);
    }
    return teams[0].id;
  }

  static async processTeamRow(row, connection) {
    const name = getValue(row, ['name', 'team_name', 'team']);
    const description = getValue(row, ['description']);
    const teamLeadId = await this.resolveUserId(row, connection);

    if (!name) {
      throw new Error('Team name is required');
    }

    const [existing] = await connection.query('SELECT id FROM teams WHERE name = ? LIMIT 1', [name]);
    if (existing.length > 0) {
      return 'skipped';
    }

    const [insert] = await connection.query(
      'INSERT INTO teams (name, description, team_lead_id) VALUES (?, ?, ?)',
      [name, description || null, teamLeadId]
    );

    if (teamLeadId) {
      await connection.query(
        'INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
        [insert.insertId, teamLeadId]
      );
      await connection.query(
        'UPDATE users SET role = ? WHERE id = ? AND role = ?',
        ['team_lead', teamLeadId, 'member']
      );
    }

    return 'created';
  }

  static async processProjectRow(row, createdBy, connection) {
    const name = getValue(row, ['name', 'project_name']);
    const keyCode = getValue(row, ['key_code', 'key']).toUpperCase();
    const description = getValue(row, ['description']);
    const startDate = getValue(row, ['start_date']) || null;
    const endDate = getValue(row, ['end_date']) || null;
    const boardTypeRaw = getValue(row, ['board_type']).toLowerCase();
    const boardType = boardTypeRaw && ALLOWED_BOARD_TYPES.includes(boardTypeRaw) ? boardTypeRaw : 'scrum';
    const teamId = await this.resolveTeamId(row, connection);

    if (!name || !keyCode) {
      throw new Error('Missing required project columns: name, key_code');
    }

    const [existing] = await connection.query('SELECT id FROM projects WHERE key_code = ? LIMIT 1', [keyCode]);
    if (existing.length > 0) {
      return 'skipped';
    }

    await connection.query(
      `INSERT INTO projects
       (name, key_code, description, team_id, created_by, start_date, end_date, board_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, keyCode, description || null, teamId, createdBy, startDate, endDate, boardType]
    );

    return 'created';
  }

  static async processTeamMemberRow(row, connection) {
    const teamId = await this.resolveTeamId(row, connection);
    const userId = await this.resolveUserId(row, connection);

    if (!userId) {
      throw new Error('user_id or user_email is required');
    }

    const [existing] = await connection.query(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ? LIMIT 1',
      [teamId, userId]
    );
    if (existing.length > 0) {
      if (toBool(getValue(row, ['is_team_lead', 'set_as_team_lead']))) {
        await connection.query('UPDATE teams SET team_lead_id = ? WHERE id = ?', [userId, teamId]);
        await connection.query('UPDATE users SET role = ? WHERE id = ? AND role = ?', ['team_lead', userId, 'member']);
      }
      return 'skipped';
    }

    await connection.query('INSERT INTO team_members (team_id, user_id) VALUES (?, ?)', [teamId, userId]);

    if (toBool(getValue(row, ['is_team_lead', 'set_as_team_lead']))) {
      await connection.query('UPDATE teams SET team_lead_id = ? WHERE id = ?', [userId, teamId]);
      await connection.query('UPDATE users SET role = ? WHERE id = ? AND role = ?', ['team_lead', userId, 'member']);
    }

    return 'created';
  }
}

module.exports = AdminImportService;
