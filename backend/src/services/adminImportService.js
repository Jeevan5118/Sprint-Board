const db = require('../config/database');
const { hashPassword } = require('../utils/bcrypt');

const ALLOWED_IMPORT_TYPES = ['employees', 'teams', 'projects', 'team_members'];
const ALLOWED_ROLES = ['admin', 'team_lead', 'member'];
const ALLOWED_BOARD_TYPES = ['scrum', 'kanban'];

const REQUIRED_COLUMNS = {
  employees: ['email', 'password', 'team', 'projects'],
  teams: ['name'],
  projects: ['name', 'key_code'],
  team_members: []
};

const SAMPLE_COLUMNS = {
  employees: ['name', 'email', 'password', 'team', 'projects', 'role', 'doj'],
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
      return this.processEmployeeRow(row, createdBy, connection);
    }
    if (importType === 'teams') {
      return this.processTeamRow(row, connection);
    }
    if (importType === 'projects') {
      return this.processProjectRow(row, createdBy, connection);
    }
    return this.processTeamMemberRow(row, connection);
  }

  static splitName(fullName) {
    const normalized = String(fullName || '').trim();
    if (!normalized) return { firstName: '', lastName: '' };
    const parts = normalized.split(/\s+/).filter(Boolean);
    return {
      firstName: parts.shift() || '',
      lastName: parts.join(' ')
    };
  }

  static normalizeProjectKeyBase(projectName) {
    const raw = String(projectName || '')
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, ' ')
      .trim();
    if (!raw) return 'PRJ';
    const words = raw.split(/\s+/).filter(Boolean);
    if (words.length === 0) return 'PRJ';
    const acronym = words.map((w) => w[0]).join('');
    const compact = raw.replace(/\s+/g, '');
    const base = (acronym.length >= 2 ? acronym : compact).slice(0, 6);
    return base || 'PRJ';
  }

  static async generateUniqueProjectKey(projectName, connection) {
    const base = this.normalizeProjectKeyBase(projectName);
    const [matches] = await connection.query(
      'SELECT key_code FROM projects WHERE key_code = ? OR key_code LIKE ?',
      [base, `${base}%`]
    );
    if (matches.length === 0) {
      return base;
    }
    let suffix = 2;
    while (suffix < 10000) {
      const candidate = `${base}${suffix}`.slice(0, 10);
      if (!matches.some((m) => String(m.key_code).toUpperCase() === candidate.toUpperCase())) {
        return candidate;
      }
      suffix += 1;
    }
    throw new Error(`Unable to generate unique project key for ${projectName}`);
  }

  static parseProjectsField(value) {
    return String(value || '')
      .split(';')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  static async resolveOrCreateTeamByName(teamName, connection) {
    const normalizedTeam = String(teamName || '').trim();
    if (!normalizedTeam) {
      throw new Error('team is required');
    }

    const [existing] = await connection.query(
      'SELECT id FROM teams WHERE LOWER(name) = LOWER(?) LIMIT 1',
      [normalizedTeam]
    );
    if (existing.length > 0) {
      return { teamId: Number(existing[0].id), created: false };
    }

    const [insert] = await connection.query(
      'INSERT INTO teams (name, description, team_lead_id) VALUES (?, ?, ?)',
      [normalizedTeam, null, null]
    );
    return { teamId: Number(insert.insertId), created: true };
  }

  static async resolveOrCreateProject(projectName, teamId, createdBy, connection) {
    const normalizedProject = String(projectName || '').trim();
    if (!normalizedProject) return { projectId: null, created: false };

    const [existing] = await connection.query(
      'SELECT id FROM projects WHERE team_id = ? AND LOWER(name) = LOWER(?) LIMIT 1',
      [teamId, normalizedProject]
    );
    if (existing.length > 0) {
      return { projectId: Number(existing[0].id), created: false };
    }

    const keyCode = await this.generateUniqueProjectKey(normalizedProject, connection);
    const [insert] = await connection.query(
      `INSERT INTO projects
       (name, key_code, description, team_id, created_by, start_date, end_date, board_type)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [normalizedProject, keyCode, null, teamId, createdBy, null, null, 'scrum']
    );
    return { projectId: Number(insert.insertId), created: true };
  }

  static async processEmployeeRow(row, createdBy, connection) {
    const email = getValue(row, ['email']).toLowerCase();
    const password = getValue(row, ['password']);
    const fullName =
      getValue(row, ['name', 'member_name']) ||
      `${getValue(row, ['first_name', 'firstname', 'first name'])} ${getValue(row, ['last_name', 'lastname', 'last name'])}`.trim();
    const { firstName, lastName } = this.splitName(fullName);
    const doj = getValue(row, ['doj', 'date_of_joining', 'date of joining']) || null;
    const teamName = getValue(row, ['team', 'team_name']);
    const projectNames = this.parseProjectsField(getValue(row, ['projects', 'project']));
    const roleRaw = getValue(row, ['role']).toLowerCase();
    const role = ALLOWED_ROLES.includes(roleRaw) ? roleRaw : 'member';

    if (!email || !password || !firstName) {
      throw new Error('Missing required employee columns: name, email, password');
    }
    if (!teamName) {
      throw new Error('Missing required employee column: team');
    }
    if (projectNames.length === 0) {
      throw new Error('Missing required employee column: projects');
    }

    let anyCreated = false;

    const [existing] = await connection.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    let userId;
    if (existing.length > 0) {
      userId = Number(existing[0].id);
    } else {
      const hashedPassword = await hashPassword(password);
      try {
        const [insert] = await connection.query(
          'INSERT INTO users (email, password, first_name, last_name, role, doj) VALUES (?, ?, ?, ?, ?, ?)',
          [email, hashedPassword, firstName, lastName, role, doj]
        );
        userId = Number(insert.insertId);
      } catch (error) {
        if (error?.code === 'ER_BAD_FIELD_ERROR') {
          const [insert] = await connection.query(
            'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
            [email, hashedPassword, firstName, lastName, role]
          );
          userId = Number(insert.insertId);
        } else {
          throw error;
        }
      }
      anyCreated = true;
    }

    const { teamId, created: teamCreated } = await this.resolveOrCreateTeamByName(teamName, connection);
    anyCreated = anyCreated || teamCreated;

    const [tmInsert] = await connection.query(
      'INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
      [teamId, userId]
    );
    anyCreated = anyCreated || tmInsert.affectedRows > 0;

    if (role === 'team_lead') {
      await connection.query('UPDATE users SET role = ? WHERE id = ? AND role = ?', ['team_lead', userId, 'member']);
      await connection.query('UPDATE teams SET team_lead_id = ? WHERE id = ?', [userId, teamId]);
    }

    for (const projectName of projectNames) {
      const { projectId, created } = await this.resolveOrCreateProject(projectName, teamId, createdBy, connection);
      if (!projectId) continue;
      anyCreated = anyCreated || created;

      const [pmInsert] = await connection.query(
        'INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
        [projectId, userId, 'developer']
      );
      anyCreated = anyCreated || pmInsert.affectedRows > 0;
    }

    return anyCreated ? 'created' : 'skipped';
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
