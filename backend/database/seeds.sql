-- ============================================
-- SEED DATA - 1 Admin, 2 Teams, 10 Users per Team
-- ============================================

-- ============================================
-- USERS (1 Admin + 20 Team Members)
-- ============================================
INSERT INTO users (email, password, first_name, last_name, role, is_active) VALUES
-- Admin
('admin@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'System', 'Admin', 'admin', TRUE),

-- Team Alpha (10 users)
('alice.johnson@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Alice', 'Johnson', 'team_lead', TRUE),
('bob.smith@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Bob', 'Smith', 'member', TRUE),
('carol.williams@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Carol', 'Williams', 'member', TRUE),
('david.brown@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'David', 'Brown', 'member', TRUE),
('emma.davis@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Emma', 'Davis', 'member', TRUE),
('frank.miller@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Frank', 'Miller', 'member', TRUE),
('grace.wilson@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Grace', 'Wilson', 'member', TRUE),
('henry.moore@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Henry', 'Moore', 'member', TRUE),
('iris.taylor@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Iris', 'Taylor', 'member', TRUE),
('jack.anderson@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Jack', 'Anderson', 'member', TRUE),

-- Team Beta (10 users)
('kate.thomas@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Kate', 'Thomas', 'team_lead', TRUE),
('liam.jackson@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Liam', 'Jackson', 'member', TRUE),
('mia.white@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Mia', 'White', 'member', TRUE),
('noah.harris@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Noah', 'Harris', 'member', TRUE),
('olivia.martin@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Olivia', 'Martin', 'member', TRUE),
('paul.thompson@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Paul', 'Thompson', 'member', TRUE),
('quinn.garcia@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Quinn', 'Garcia', 'member', TRUE),
('ryan.martinez@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Ryan', 'Martinez', 'member', TRUE),
('sophia.robinson@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Sophia', 'Robinson', 'member', TRUE),
('tyler.clark@scrumboard.com', '$2b$10$XqZ9J5K8L9M0N1O2P3Q4R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G0H', 'Tyler', 'Clark', 'member', TRUE);

-- ============================================
-- TEAMS (2 Teams)
-- ============================================
INSERT INTO teams (name, description, team_lead_id) VALUES
('Team Alpha', 'Frontend and Mobile Development Team', 2),
('Team Beta', 'Backend and Infrastructure Team', 12);

-- ============================================
-- TEAM MEMBERS (10 per team)
-- ============================================
-- Team Alpha Members
INSERT INTO team_members (team_id, user_id) VALUES
(1, 2), (1, 3), (1, 4), (1, 5), (1, 6), (1, 7), (1, 8), (1, 9), (1, 10), (1, 11);

-- Team Beta Members
INSERT INTO team_members (team_id, user_id) VALUES
(2, 12), (2, 13), (2, 14), (2, 15), (2, 16), (2, 17), (2, 18), (2, 19), (2, 20), (2, 21);

-- ============================================
-- PROJECTS (Sample Projects)
-- ============================================
INSERT INTO projects (name, key_code, description, team_id, created_by, start_date, end_date, status) VALUES
('E-Commerce Platform', 'ECP', 'Building a modern e-commerce platform with React and Node.js', 1, 2, '2024-01-01', '2024-12-31', 'active'),
('Mobile Banking App', 'MBA', 'iOS and Android banking application', 1, 2, '2024-02-01', '2024-11-30', 'active'),
('Cloud Infrastructure', 'CLD', 'AWS cloud infrastructure setup and migration', 2, 12, '2024-01-15', '2024-10-15', 'active'),
('API Gateway Service', 'AGS', 'Microservices API gateway implementation', 2, 12, '2024-03-01', '2024-09-30', 'active');

-- ============================================
-- PROJECT MEMBERS
-- ============================================
-- E-Commerce Platform Team
INSERT INTO project_members (project_id, user_id, role) VALUES
(1, 2, 'owner'), (1, 3, 'developer'), (1, 4, 'developer'), (1, 5, 'tester'), (1, 6, 'developer');

-- Mobile Banking App Team
INSERT INTO project_members (project_id, user_id, role) VALUES
(2, 2, 'owner'), (2, 7, 'developer'), (2, 8, 'developer'), (2, 9, 'tester');

-- Cloud Infrastructure Team
INSERT INTO project_members (project_id, user_id, role) VALUES
(3, 12, 'owner'), (3, 13, 'developer'), (3, 14, 'developer'), (3, 15, 'developer');

-- API Gateway Service Team
INSERT INTO project_members (project_id, user_id, role) VALUES
(4, 12, 'owner'), (4, 16, 'developer'), (4, 17, 'developer'), (4, 18, 'tester');

-- ============================================
-- SPRINTS (Sample Sprints)
-- ============================================
INSERT INTO sprints (name, goal, project_id, start_date, end_date, status) VALUES
('Sprint 1', 'Setup project foundation and authentication', 1, '2024-01-01', '2024-01-14', 'completed'),
('Sprint 2', 'Product catalog and shopping cart', 1, '2024-01-15', '2024-01-28', 'completed'),
('Sprint 3', 'Payment integration and checkout', 1, '2024-01-29', '2024-02-11', 'active'),
('Sprint 1', 'User authentication and onboarding', 2, '2024-02-01', '2024-02-14', 'active'),
('Sprint 1', 'AWS account setup and VPC configuration', 3, '2024-01-15', '2024-01-28', 'completed'),
('Sprint 2', 'Database migration and backup strategy', 3, '2024-01-29', '2024-02-11', 'active'),
('Sprint 1', 'API gateway architecture design', 4, '2024-03-01', '2024-03-14', 'planned');

-- ============================================
-- TASKS (Sample Tasks with Story Points)
-- ============================================
INSERT INTO tasks (title, description, task_key, sprint_id, project_id, assigned_to, reporter_id, type, priority, status, story_points, estimated_hours) VALUES
-- Sprint 1 Tasks (ECP)
('Setup React project structure', 'Initialize React app with routing and state management', 'ECP-1', 1, 1, 3, 2, 'task', 'high', 'done', 3, 8.00),
('Implement JWT authentication', 'Backend JWT token generation and validation', 'ECP-2', 1, 1, 4, 2, 'story', 'highest', 'done', 5, 16.00),
('Design database schema', 'Create MySQL database schema for all entities', 'ECP-3', 1, 1, 3, 2, 'task', 'high', 'done', 3, 6.00),

-- Sprint 2 Tasks (ECP)
('Build product listing page', 'Display products with filters and pagination', 'ECP-4', 2, 1, 3, 2, 'story', 'high', 'done', 5, 12.00),
('Create shopping cart functionality', 'Add/remove items, update quantities', 'ECP-5', 2, 1, 4, 2, 'story', 'high', 'done', 8, 20.00),
('Fix product image loading bug', 'Images not loading on slow connections', 'ECP-6', 2, 1, 3, 5, 'bug', 'medium', 'done', 2, 4.00),

-- Sprint 3 Tasks (ECP)
('Integrate Stripe payment gateway', 'Setup Stripe SDK and payment processing', 'ECP-7', 3, 1, 4, 2, 'story', 'highest', 'in_progress', 8, 24.00),
('Build checkout page UI', 'Design and implement checkout flow', 'ECP-8', 3, 1, 3, 2, 'story', 'high', 'in_progress', 5, 16.00),
('Add order confirmation email', 'Send email after successful payment', 'ECP-9', 3, 1, 6, 2, 'task', 'medium', 'todo', 3, 8.00),
('Write payment integration tests', 'Unit and integration tests for payment flow', 'ECP-10', 3, 1, 5, 2, 'task', 'medium', 'todo', 5, 12.00),

-- Mobile Banking App Tasks
('Design app navigation structure', 'Bottom tab navigation with screens', 'MBA-1', 4, 2, 7, 2, 'task', 'high', 'in_progress', 3, 8.00),
('Implement biometric authentication', 'Face ID and fingerprint login', 'MBA-2', 4, 2, 8, 2, 'story', 'highest', 'in_progress', 8, 20.00),
('Create account dashboard', 'Display account balance and recent transactions', 'MBA-3', 4, 2, 7, 2, 'story', 'high', 'todo', 5, 16.00),

-- Cloud Infrastructure Tasks
('Setup AWS VPC and subnets', 'Configure network infrastructure', 'CLD-1', 5, 3, 13, 12, 'task', 'highest', 'done', 5, 12.00),
('Configure RDS MySQL instance', 'Setup managed database with backups', 'CLD-2', 6, 3, 14, 12, 'task', 'high', 'in_progress', 5, 10.00),
('Implement CI/CD pipeline', 'Setup GitHub Actions for deployment', 'CLD-3', 6, 3, 13, 12, 'story', 'high', 'in_review', 8, 16.00),

-- API Gateway Tasks
('Design API gateway architecture', 'Document microservices communication pattern', 'AGS-1', 7, 4, 16, 12, 'epic', 'highest', 'todo', 13, 40.00);

-- ============================================
-- COMMENTS (Sample Comments)
-- ============================================
INSERT INTO comments (task_id, user_id, content) VALUES
(1, 2, 'Great job on the project setup! The folder structure looks clean.'),
(1, 3, 'Thanks! I followed the best practices from the React documentation.'),
(2, 5, 'Please make sure to add refresh token functionality as well.'),
(2, 4, 'Already implemented! Check the authService.js file.'),
(7, 2, 'Make sure to test with Stripe test cards before going live.'),
(7, 4, 'Will do. I have the test card numbers from Stripe docs.'),
(12, 2, 'This is a critical feature. Let me know if you need any help.'),
(12, 8, 'Thanks! Currently working on the iOS implementation.');

-- ============================================
-- TASK LINKS (Reference Links)
-- ============================================
INSERT INTO task_links (task_id, url, title, description, added_by) VALUES
(2, 'https://jwt.io/introduction', 'JWT Introduction', 'Official JWT documentation', 2),
(7, 'https://stripe.com/docs/payments', 'Stripe Payments API', 'Stripe payment integration guide', 4),
(7, 'https://stripe.com/docs/testing', 'Stripe Testing', 'Test card numbers and scenarios', 4),
(12, 'https://developer.apple.com/documentation/localauthentication', 'Apple Local Authentication', 'Face ID and Touch ID documentation', 8),
(15, 'https://docs.aws.amazon.com/codepipeline/', 'AWS CodePipeline', 'CI/CD pipeline documentation', 13);

-- ============================================
-- TASK ATTACHMENTS (Sample Attachments)
-- ============================================
INSERT INTO task_attachments (task_id, uploaded_by, file_name, file_path, file_size, file_type) VALUES
(3, 2, 'database_schema.png', '/uploads/tasks/3/database_schema.png', 245678, 'image/png'),
(4, 3, 'product_mockup.pdf', '/uploads/tasks/4/product_mockup.pdf', 1024000, 'application/pdf'),
(8, 3, 'checkout_wireframe.fig', '/uploads/tasks/8/checkout_wireframe.fig', 512000, 'application/octet-stream'),
(16, 16, 'api_architecture.pdf', '/uploads/tasks/16/api_architecture.pdf', 890000, 'application/pdf');
