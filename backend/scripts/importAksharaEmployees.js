const db = require('../src/config/database');
const { hashPassword } = require('../src/utils/bcrypt');

const rows = [
  ['Keshav', 'keshav@aksharaenterprises.com', 'Ke#4831Ax', 'SPOS', 'Etiquette;Contractual'],
  ['Chirag', 'chirag@aksharaenterprises.com', 'Ch#5924Lm', 'SPOS', 'Contractual'],
  ['Mahin', 'mahin@aksharaenterprises.com', 'Ma#7342Qz', 'SPOS', 'Affiliate Company'],
  ['Vedanth', 'vedanth@aksharaenterprises.com', 'Ve#8471Tr', 'SPOS', 'Building Community'],
  ['Sushma', 'sushma@aksharaenterprises.com', 'Su#2964Bn', 'SPOS', 'Etiquette'],
  ['Prakruthi', 'prakruthi@aksharaenterprises.com', 'Pr#6518Ka', 'SPOS', 'Affiliate Company'],
  ['Deepthi', 'deepthi@aksharaenterprises.com', 'De#4729Xt', 'SPOS', 'Contractual'],
  ['Jeff', 'jeff@aksharaenterprises.com', 'Je#9183Lm', 'SPOS', 'Affiliate Company'],
  ['Shreesha', 'shreesha@aksharaenterprises.com', 'Sh#6402Pt', 'SPOS', 'Building Community'],
  ['Yashas', 'yashas@aksharaenterprises.com', 'Ya#2746Rw', 'SPOS', 'Contractual'],
  ['Chaaya', 'chaaya@aksharaenterprises.com', 'Ch#8531Nk', 'SPOS', 'Etiquette'],
  ['Manya', 'manya@aksharaenterprises.com', 'Ma#4627Qt', 'SPOS', 'Building Community'],
  ['Tarun', 'tarun@aksharaenterprises.com', 'Ta#5718Lm', 'SOLID', 'Bootcamp'],
  ['Avish Krishna', 'avish.krishna@aksharaenterprises.com', 'Av#6932Xt', 'SOLID', 'Bootcamp'],
  ['Ujwal', 'ujwal@aksharaenterprises.com', 'Uj#8473Rw', 'SOLID', 'Bootcamp'],
  ['Subramanya', 'subramanya@aksharaenterprises.com', 'Su#2749Kn', 'SOLID', 'Bootcamp'],
  ['Pramukh BK', 'pramukh@aksharaenterprises.com', 'Pr#6153Xt', 'SOLID', 'Bootcamp'],
  ['Dominic', 'dominic@aksharaenterprises.com', 'Do#7394Rt', 'SOLID', 'Bootcamp'],
  ['Vasudha', 'vasudha@aksharaenterprises.com', 'Va#8426Lm', 'SOLID', 'Bootcamp'],
  ['Yuvan', 'yuvan@aksharaenterprises.com', 'Yu#3952Rt', 'SPECIFIC', 'Free Business Psychology'],
  ['Vidhi', 'vidhi@aksharaenterprises.com', 'Vi#8472Lm', 'SPECIFIC', 'Cresentia'],
  ['Siddhi', 'siddhi@aksharaenterprises.com', 'Si#6291Xt', 'SPECIFIC', 'Private Tuitions'],
  ['Chandan', 'chandan@aksharaenterprises.com', 'Ch#5846Rw', 'SPECIFIC', 'Specific Affiliates'],
  ['Tanvi', 'tanvi@aksharaenterprises.com', 'Ta#4719Kn', 'SPECIFIC', 'Free Business Psychology'],
  ['Pavan', 'pavan@aksharaenterprises.com', 'Pa#7352Lm', 'PRODUCT', 'Product Team'],
  ['Abhilash', 'abhilash@aksharaenterprises.com', 'Ab#4927Xt', 'PRODUCT', 'Shop Team'],
  ['Nithin', 'nithin@aksharaenterprises.com', 'Ni#8641Rw', 'PRODUCT', 'Product Team'],
  ['Shreyas S', 'shreyas.s@aksharaenterprises.com', 'Sh#6274Kn', 'PRODUCT', 'BP Community Extras'],
  ['Ranjith', 'ranjith@aksharaenterprises.com', 'Ra#5183Xt', 'PRODUCT', 'Shop Team'],
  ['Rahul V', 'rahul.v@aksharaenterprises.com', 'Ra#7284Xt', 'STUDENT', 'PrepX Masterclass'],
  ['Pranav N', 'pranav.n@aksharaenterprises.com', 'Pr#6342Lm', 'STUDENT', 'Summer Camp'],
  ['Vitasta', 'vitasta@aksharaenterprises.com', 'Vi#9513Rw', 'STUDENT', 'Competitions'],
  ['Benjamin', 'benjamin@aksharaenterprises.com', 'Be#8472Xt', 'STUDENT', 'Interns Company'],
  ['Khushi', 'khushi@aksharaenterprises.com', 'Kh#2754Lm', 'STUDENT', 'Volunteering'],
  ['Sanjana', 'sanjana@aksharaenterprises.com', 'Sa#6391Kn', 'STUDENT', 'Competitions'],
  ['Rithwik', 'rithwik@aksharaenterprises.com', 'Ri#4837Xt', 'STUDENT', 'PrepX Masterclass'],
  ['Elvin', 'elvin@aksharaenterprises.com', 'El#7521Rw', 'STUDENT', 'Interns Company'],
  ['Gowthami', 'gowthami@aksharaenterprises.com', 'Go#8462Lm', 'STUDENT', 'Volunteering'],
  ['Nihaar', 'nihaar@aksharaenterprises.com', 'Ni#5179Xt', 'STUDENT', 'Summer Camp'],
  ['Ananth', 'ananth@aksharaenterprises.com', 'An#7425Lm', 'HR', 'Hiring & Training'],
  ['Harris', 'harris@aksharaenterprises.com', 'Ha#6283Xt', 'HR', 'BP Community'],
  ['Chandini', 'chandini@aksharaenterprises.com', 'Ch#9517Rw', 'HR', 'Hiring & Training'],
  ['Godavari', 'godavari@aksharaenterprises.com', 'Go#4832Lm', 'HR', 'Hire Right'],
  ['Rahul Hemanth', 'rahul.hemanth@aksharaenterprises.com', 'Ra#7261Xt', 'HR', 'Ace It Up'],
  ['Suhas', 'suhas@aksharaenterprises.com', 'Su#9154Rw', 'HR', 'BP Community'],
  ['Praneel', 'praneel@aksharaenterprises.com', 'Pr#6827Lm', 'HR', 'Hiring & Training'],
  ['Abhinitha', 'abhinitha@aksharaenterprises.com', 'Ab#4735Xt', 'HR', 'Hire Right'],
  ['Madhumati', 'madhumati@aksharaenterprises.com', 'Ma#8153Rw', 'HR', 'Ace It Up'],
  ['Vishnu Menon', 'vishnu.menon@aksharaenterprises.com', 'Vi#6274Xt', 'HR', 'BP Community'],
  ['Trinaina', 'trinaina@aksharaenterprises.com', 'Tr#4926Lm', 'HR', 'Hiring & Training'],
  ['Shoaib', 'shoaib@aksharaenterprises.com', 'Sh#7352Rw', 'HR', 'Hire Right']
];

const splitName = (fullName) => {
  const parts = String(fullName || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return { firstName: 'User', lastName: 'Member' };
  }
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: 'Member' };
  }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
};

const projectKeyBase = (projectName) => {
  const cleaned = String(projectName || '')
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'PRJ';
  const initials = words.map((w) => w[0].toUpperCase()).join('').slice(0, 6);
  return initials || cleaned.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6) || 'PRJ';
};

const makeUniqueProjectKey = async (conn, name) => {
  const base = projectKeyBase(name);
  let suffix = 1;
  while (suffix < 1000) {
    const candidate = `${base}${suffix}`.slice(0, 10);
    const [rowsFound] = await conn.query('SELECT id FROM projects WHERE key_code = ? LIMIT 1', [candidate]);
    if (rowsFound.length === 0) return candidate;
    suffix += 1;
  }
  throw new Error(`Unable to generate unique key for project: ${name}`);
};

const ensureTeam = async (conn, teamName, stats) => {
  const [existing] = await conn.query('SELECT id FROM teams WHERE name = ? LIMIT 1', [teamName]);
  if (existing.length > 0) return existing[0].id;
  const [inserted] = await conn.query('INSERT INTO teams (name, description) VALUES (?, ?)', [
    teamName,
    `${teamName} team`
  ]);
  stats.teamsCreated += 1;
  return inserted.insertId;
};

const ensureProject = async (conn, projectName, teamId, createdBy, stats) => {
  const [existing] = await conn.query(
    'SELECT id FROM projects WHERE name = ? AND team_id = ? LIMIT 1',
    [projectName, teamId]
  );
  if (existing.length > 0) return existing[0].id;

  const keyCode = await makeUniqueProjectKey(conn, projectName);
  const [inserted] = await conn.query(
    `INSERT INTO projects (name, key_code, description, team_id, created_by, board_type)
     VALUES (?, ?, ?, ?, ?, 'scrum')`,
    [projectName, keyCode, `${projectName} project`, teamId, createdBy]
  );
  stats.projectsCreated += 1;
  return inserted.insertId;
};

const ensureUser = async (conn, name, email, password, stats) => {
  const [existing] = await conn.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
  if (existing.length > 0) {
    stats.usersSkipped += 1;
    return existing[0].id;
  }

  const { firstName, lastName } = splitName(name);
  const passwordHash = await hashPassword(password);
  const [inserted] = await conn.query(
    `INSERT INTO users (email, password, first_name, last_name, role)
     VALUES (?, ?, ?, ?, 'member')`,
    [email, passwordHash, firstName, lastName]
  );
  stats.usersCreated += 1;
  return inserted.insertId;
};

const ensureTeamMember = async (conn, teamId, userId, stats) => {
  const [result] = await conn.query(
    'INSERT IGNORE INTO team_members (team_id, user_id) VALUES (?, ?)',
    [teamId, userId]
  );
  if (result.affectedRows > 0) stats.teamMembershipsCreated += 1;
};

const ensureProjectMember = async (conn, projectId, userId, stats) => {
  const [result] = await conn.query(
    'INSERT IGNORE INTO project_members (project_id, user_id, role) VALUES (?, ?, ?)',
    [projectId, userId, 'developer']
  );
  if (result.affectedRows > 0) stats.projectMembershipsCreated += 1;
};

const run = async () => {
  const stats = {
    usersCreated: 0,
    usersSkipped: 0,
    teamsCreated: 0,
    projectsCreated: 0,
    teamMembershipsCreated: 0,
    projectMembershipsCreated: 0
  };

  const conn = await db.getConnection();
  try {
    const [admins] = await conn.query("SELECT id FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1");
    if (admins.length === 0) {
      throw new Error('No admin user found. Create at least one admin first.');
    }
    const adminId = admins[0].id;

    for (const [name, email, password, teamName, projectList] of rows) {
      await conn.beginTransaction();
      try {
        const teamId = await ensureTeam(conn, teamName, stats);
        const userId = await ensureUser(conn, name, email.toLowerCase(), password, stats);
        await ensureTeamMember(conn, teamId, userId, stats);

        const projects = String(projectList)
          .split(';')
          .map((p) => p.trim())
          .filter(Boolean);

        for (const projectName of projects) {
          const projectId = await ensureProject(conn, projectName, teamId, adminId, stats);
          await ensureProjectMember(conn, projectId, userId, stats);
        }

        await conn.commit();
      } catch (err) {
        await conn.rollback();
        throw err;
      }
    }

    console.log('Import complete.');
    console.log(JSON.stringify(stats, null, 2));
  } finally {
    conn.release();
  }
};

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });
