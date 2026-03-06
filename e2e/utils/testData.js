const now = Date.now();

const testData = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@example.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123'
  },
  employee: {
    email: process.env.EMPLOYEE_EMAIL || 'employee@example.com',
    password: process.env.EMPLOYEE_PASSWORD || 'Employee@123',
    displayName: process.env.EMPLOYEE_DISPLAY_NAME || ''
  },
  uniqueProject: {
    name: `E2E Project ${now}`,
    key: `E2E${String(now).slice(-5)}`
  },
  uniqueSprint: {
    name: `E2E Sprint ${now}`
  },
  uniqueTask: {
    title: `E2E Task ${now}`
  },
  uniqueEmployee: {
    firstName: 'E2E',
    lastName: `User${String(now).slice(-4)}`,
    email: `e2e.user.${now}@example.com`,
    password: 'E2EUser@123'
  }
};

module.exports = { testData };
