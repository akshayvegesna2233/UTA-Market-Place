-- UTA Market Place Database Setup
-- This script creates all necessary tables and populates them with sample data
-- Compatible with MariaDB

CREATE DATABASE IF NOT EXISTS commerce_one;

USE commerce_one;

-- Drop tables if they exist to ensure clean setup
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversation_participants;
DROP TABLE IF EXISTS conversations;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS product_specifications;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS settings;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL, -- Hashed password
    avatar VARCHAR(255),
    phone VARCHAR(20),
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    join_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'user',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    email_alerts BOOLEAN DEFAULT TRUE,
    text_alerts BOOLEAN DEFAULT FALSE,
    new_message_notifications BOOLEAN DEFAULT TRUE,
    new_listing_notifications BOOLEAN DEFAULT TRUE,
    marketing_emails BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0.0,
    total_sales INTEGER DEFAULT 0,
    CHECK (email LIKE '%@mavs.uta.edu'),
    CHECK (role IN ('user', 'admin')),
    CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Create categories table
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    icon VARCHAR(50) -- Emoji or icon class
);

-- Create products table
CREATE TABLE products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    seller_id INT NOT NULL,
    category_id INT NOT NULL,
    item_condition VARCHAR(50) NOT NULL, -- Changed from 'condition' as it's a reserved word
    location VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    views INTEGER DEFAULT 0,
    interested INTEGER DEFAULT 0,
    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    CHECK (status IN ('active', 'pending', 'sold'))
);

-- Create product_images table
CREATE TABLE product_images (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    image_url VARCHAR(255) NOT NULL,
    is_main BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create product_specifications table
CREATE TABLE product_specifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    value TEXT NOT NULL,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create orders table
CREATE TABLE orders (
  id VARCHAR(20) PRIMARY KEY, -- Custom format like ORD-12345
  buyer_id INT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  service_fee DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  delivery_address TEXT,
  delivery_city VARCHAR(100),
  delivery_state VARCHAR(50),
  delivery_zip VARCHAR(20),
  FOREIGN KEY (buyer_id) REFERENCES users(id),
  CHECK (status IN ('pending', 'completed', 'cancelled')),
  CHECK (payment_status IN ('paid', 'pending'))
);

-- Create order_items table
CREATE TABLE order_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(20) NOT NULL,
    product_id INT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    price_at_purchase DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create reviews table
CREATE TABLE reviews (
   id INT AUTO_INCREMENT PRIMARY KEY,
   reviewer_id INT NOT NULL,
   product_id INT,
   seller_id INT NOT NULL,
   rating INTEGER NOT NULL,
   comment TEXT,
   date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (reviewer_id) REFERENCES users(id),
   FOREIGN KEY (product_id) REFERENCES products(id),
   FOREIGN KEY (seller_id) REFERENCES users(id),
   CHECK (rating BETWEEN 1 AND 5)
);

-- Create conversations table
CREATE TABLE conversations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_message_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create a table for conversation participants
CREATE TABLE conversation_participants (
    conversation_id INT NOT NULL,
    user_id INT NOT NULL,
    unread_count INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (conversation_id, user_id),
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create messages table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT NOT NULL,
    sender_id INT NOT NULL,
    text TEXT NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- Create reports table
CREATE TABLE reports (
   id INT AUTO_INCREMENT PRIMARY KEY,
   type VARCHAR(20) NOT NULL,
   item_id INTEGER NOT NULL, -- Can be user_id or product_id
   reported_by_id INT NOT NULL,
   reason TEXT NOT NULL,
   status VARCHAR(20) NOT NULL DEFAULT 'pending',
   date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
   FOREIGN KEY (reported_by_id) REFERENCES users(id),
   CHECK (type IN ('User', 'Listing')),
   CHECK (status IN ('pending', 'resolved', 'dismissed'))
);

-- Create settings table
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    platform_name VARCHAR(100) NOT NULL DEFAULT 'UTA Market Place',
    support_email VARCHAR(100) NOT NULL DEFAULT 'support@utamarketplace.edu',
    items_per_page INTEGER NOT NULL DEFAULT 20,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 5.00,
    min_commission DECIMAL(10,2) NOT NULL DEFAULT 0.50,
    require_email_verification BOOLEAN NOT NULL DEFAULT TRUE,
    require_admin_approval BOOLEAN NOT NULL DEFAULT TRUE,
    enable_two_factor BOOLEAN NOT NULL DEFAULT TRUE,
    CHECK (id = 1)
);

-- Create cart_items table
CREATE TABLE cart_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    product_id INT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Add indexes for better performance
CREATE INDEX idx_products_seller ON products(seller_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_reviews_seller ON reviews(seller_id);
CREATE INDEX idx_reviews_product ON reviews(product_id);

-- Insert sample data

-- Insert users
INSERT INTO users (id, first_name, last_name, email, password, avatar, phone, street_address, city, state, zip_code, join_date, role, rating, total_sales)
VALUES
    (101, 'Test', 'Name', 'test.name@mavs.uta.edu', '$2a$10$KJE4.OiZ0UJ.0G03YZLfB.dKfP.0W3/K9kq0i3.1b6qyD0tjvM9VK', 'https://images.unsplash.com/photo-1586622977567-bc45e4ae72fe', '(123) 456-7890', '123 Campus Street', 'Arlington', 'TX', '76019', '2025-01-15 10:30:00', 'user', 4.8, 12),
    (102, 'Sarah', 'Smith', 'sarah.smith@mavs.uta.edu', '$2a$10$KJE4.OiZ0UJ.0G03YZLfB.dKfP.0W3/K9kq0i3.1b6qyD0tjvM9VK', 'https://images.unsplash.com/photo-1554151228-14d9def656e4', NULL, NULL, NULL, NULL, NULL, '2025-01-20 14:45:00', 'user', 4.9, 5),
    (103, 'Michael', 'Johnson', 'michael.johnson@mavs.uta.edu', '$2a$10$KJE4.OiZ0UJ.0G03YZLfB.dKfP.0W3/K9kq0i3.1b6qyD0tjvM9VK', 'https://images.unsplash.com/photo-1500048993953-d23a436266cf', NULL, NULL, NULL, NULL, NULL, '2025-01-18 09:15:00', 'user', 4.7, 3),
    (104, 'Emily', 'Wilson', 'emily.wilson@mavs.uta.edu', '$2a$10$KJE4.OiZ0UJ.0G03YZLfB.dKfP.0W3/K9kq0i3.1b6qyD0tjvM9VK', 'https://images.unsplash.com/photo-1580489944761-15a19d654956', NULL, NULL, NULL, NULL, NULL, '2025-01-25 16:20:00', 'user', 4.5, 2),
    (105, 'David', 'Lee', 'david.lee@mavs.uta.edu', '$2a$10$KJE4.OiZ0UJ.0G03YZLfB.dKfP.0W3/K9kq0i3.1b6qyD0tjvM9VK', NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-10 11:00:00', 'user', 4.2, 4),
    (106, 'Admin', 'User', 'admin.user@mavs.uta.edu', '$2a$10$KJE4.OiZ0UJ.0G03YZLfB.dKfP.0W3/K9kq0i3.1b6qyD0tjvM9VK', NULL, NULL, NULL, NULL, NULL, NULL, '2025-01-01 00:00:00', 'admin', 5.0, 0);

-- Insert categories
INSERT INTO categories (id, name, icon)
VALUES
    (1, 'Textbooks', '📚'),
    (2, 'Electronics', '💻'),
    (3, 'Furniture', '🪑'),
    (4, 'Clothing', '👕'),
    (5, 'School Supplies', '✏️'),
    (6, 'Other', '📦');

-- Insert products (note the change from 'condition' to 'item_condition')
INSERT INTO products (id, name, description, price, seller_id, category_id, item_condition, location, status, created_at, views, interested)
VALUES
    (1, 'TI-84 Plus Calculator', 'Graphing calculator, slightly used but works perfectly. This is perfect for calculus, statistics, and other math courses. Batteries included and recently replaced.', 75.00, 101, 2, 'Used - Like New', 'UTA Campus', 'active', '2025-02-05 12:00:00', 45, 3),
    (2, 'Principles of Economics Textbook', 'Eighth edition, great condition with minimal highlighting.', 45.00, 102, 1, 'Used - Good', 'UTA Campus', 'active', '2025-02-01 09:30:00', 28, 2),
    (3, 'Desk Lamp', 'Adjustable LED desk lamp with multiple brightness settings.', 20.00, 103, 3, 'Used - Good', 'UTA Campus', 'active', '2025-02-08 15:45:00', 15, 1),
    (4, 'UTA Hoodie', 'Size L, worn only a few times. Official merchandise.', 35.00, 104, 4, 'Used - Like New', 'UTA Campus', 'active', '2025-02-07 11:20:00', 37, 5),
    (5, 'Computer Science Fundamentals', 'Latest edition of this CS textbook. No markings or damage.', 55.00, 105, 1, 'Used - Like New', 'UTA Campus', 'active', '2025-02-03 14:10:00', 19, 2),
    (6, 'Wireless Mouse', 'Bluetooth wireless mouse with ergonomic design.', 18.00, 102, 2, 'Used - Good', 'UTA Campus', 'active', '2025-02-06 10:05:00', 22, 1),
    (7, 'Dorm Room Chair', 'Comfortable chair, perfect for studying.', 40.00, 103, 3, 'Used - Acceptable', 'UTA Campus', 'active', '2025-02-09 09:15:00', 12, 0),
    (8, 'Scientific Calculator', 'Basic scientific calculator for math and science courses.', 12.50, 104, 5, 'Used - Good', 'UTA Campus', 'active', '2025-02-04 16:30:00', 9, 1),
    (9, 'Database Systems Textbook', 'Latest edition with all supplementary materials included.', 50.00, 101, 1, 'Used - Like New', 'UTA Campus', 'active', '2025-02-01 09:30:00', 28, 2),
    (10, 'UTA T-Shirt Size M', 'Official UTA merchandise, excellent condition.', 15.00, 101, 4, 'Used - Good', 'UTA Campus', 'sold', '2025-01-20 15:45:00', 37, 5),
    (11, 'iPhone 13 Pro', 'Great condition, includes original box and charger.', 650.00, 101, 2, 'Used - Like New', 'UTA Campus', 'pending', '2025-02-09 14:30:00', 8, 2),
    (12, 'Calculus Textbook', 'Perfect for calculus courses, minimal highlighting.', 45.00, 102, 1, 'Used - Good', 'UTA Campus', 'approved', '2025-02-08 10:15:00', 15, 1),
    (13, 'Dorm Refrigerator', 'Small fridge perfect for dorm rooms.', 80.00, 104, 3, 'Used - Good', 'UTA Campus', 'approved', '2025-02-07 16:45:00', 19, 3),
    (14, 'UTA Parking Pass', 'Spring semester parking pass, transferable.', 120.00, 105, 6, 'New', 'UTA Campus', 'rejected', '2025-02-06 09:30:00', 25, 4);

-- Insert product images
INSERT INTO product_images (product_id, image_url, is_main)
VALUES
    (1, 'https://images.unsplash.com/photo-1628358011414-fb7ddaca0dbb', TRUE),
    (1, 'https://images.unsplash.com/photo-1628358011846-80e98db9e925', FALSE),
    (1, 'https://images.unsplash.com/photo-1628358011438-bf07b5582d54', FALSE),
    (2, 'https://images.unsplash.com/photo-1588912914017-923900a34710', TRUE),
    (3, 'https://images.unsplash.com/photo-1619608135352-868e8313e121', TRUE),
    (4, 'https://images.unsplash.com/photo-1565978771542-0db9ab9ad3de', TRUE),
    (5, 'https://images.unsplash.com/photo-1541963463532-d68292c34b19', TRUE),
    (6, 'https://images.unsplash.com/photo-1620332326501-584c3d6bf607', TRUE),
    (7, 'https://images.unsplash.com/photo-1463620910506-d0458143143e', TRUE),
    (8, 'https://images.unsplash.com/photo-1675242314995-034d11bac319', TRUE),
    (9, 'https://images.unsplash.com/photo-1614332737108-dea7a4895daa', TRUE),
    (10, 'https://images.unsplash.com/photo-1562157873-818bc0726f68', TRUE),
    (11, 'https://images.unsplash.com/photo-1587145820266-a5951ee6f620', TRUE),
    (12, 'https://images.unsplash.com/photo-1544947950-fa07a98d237f', TRUE),
    (13, 'https://images.unsplash.com/photo-1564540583246-934409427276', TRUE),
    (14, 'https://images.unsplash.com/photo-1580674571597-1cf27cfdc4d2', TRUE);

-- Insert product specifications (note we're updating from 'condition' to 'item_condition' where appropriate)
INSERT INTO product_specifications (product_id, name, value)
VALUES
    (1, 'Brand', 'Texas Instruments'),
    (1, 'Model', 'TI-84 Plus'),
    (1, 'Condition', 'Used - Like New'),
    (1, 'Includes', 'Calculator, Cover, Manual'),
    (2, 'Author', 'N. Gregory Mankiw'),
    (2, 'Edition', '8th'),
    (2, 'Publisher', 'Cengage Learning'),
    (2, 'Condition', 'Used - Good'),
    (9, 'Author', 'Abraham Silberschatz'),
    (9, 'Edition', '7th'),
    (9, 'Publisher', 'McGraw-Hill'),
    (9, 'Condition', 'Used - Like New');

-- Insert orders
INSERT INTO orders (id, buyer_id, total, service_fee, status, payment_method, payment_status, created_at)
VALUES
    ('ORD-12345', 102, 75.00, 3.75, 'completed', 'credit', 'paid', '2025-02-10 14:30:00'),
    ('ORD-12346', 102, 53.50, 2.68, 'completed', 'credit', 'paid', '2025-02-05 09:15:00'),
    ('ORD-12347', 102, 35.00, 1.75, 'pending', 'paypal', 'pending', '2025-02-01 11:20:00'),
    ('ORD-12348', 103, 20.00, 1.00, 'completed', 'credit', 'paid', '2025-02-01 10:15:00'),
    ('ORD-12349', 103, 45.00, 2.25, 'completed', 'credit', 'paid', '2025-01-28 14:30:00'),
    ('ORD-12350', 104, 15.00, 0.75, 'pending', 'credit', 'pending', '2025-01-25 09:45:00');

-- Insert order items
INSERT INTO order_items (order_id, product_id, quantity, price_at_purchase)
VALUES
    ('ORD-12345', 1, 1, 75.00),
    ('ORD-12346', 5, 1, 45.00),
    ('ORD-12346', 8, 1, 8.50),
    ('ORD-12347', 4, 1, 35.00),
    ('ORD-12348', 6, 1, 20.00),
    ('ORD-12349', 2, 1, 45.00),
    ('ORD-12350', 10, 1, 15.00);

-- Insert reviews
INSERT INTO reviews (reviewer_id, product_id, seller_id, rating, comment, date)
VALUES
    (102, 1, 101, 5, 'Great seller, fast response, and the calculator works perfectly.', '2025-02-01 14:30:00'),
    (103, 1, 101, 4, 'Good condition as described. Quick and easy transaction.', '2025-01-28 09:15:00'),
    (102, 10, 101, 5, 'Perfect condition, exactly as described!', '2025-01-22 13:15:00'),
    (104, 2, 102, 4, 'The textbook was in good condition, but had a bit more highlighting than expected.', '2025-01-30 16:45:00'),
    (103, 6, 102, 5, 'Mouse works great! Seller was very responsive.', '2025-02-08 10:30:00');

-- Insert conversations
INSERT INTO conversations (id, product_id, created_at, last_message_at)
VALUES
    (1, 1, '2025-02-09 14:30:00', '2025-02-09 15:20:00'),
    (2, 2, '2025-02-08 10:15:00', '2025-02-08 11:00:00'),
    (3, 4, '2025-02-07 09:30:00', '2025-02-07 10:00:00');

-- Insert conversation participants
INSERT INTO conversation_participants (conversation_id, user_id, unread_count)
VALUES
    (1, 101, 1), -- Test Name (seller)
    (1, 102, 0), -- Sarah Smith (buyer)
    (2, 103, 0), -- Michael Johnson (seller)
    (2, 101, 0), -- Test Name (buyer)
    (3, 104, 0), -- Emily Wilson (seller)
    (3, 101, 0); -- Test Name (buyer)

-- Insert messages
INSERT INTO messages (conversation_id, sender_id, text, timestamp, is_read)
VALUES
    (1, 102, 'Hi there! I''m interested in the TI-84 Calculator you listed. Is it still available?', '2025-02-09 14:30:00', TRUE),
    (1, 101, 'Yes, it''s still available! It''s in great condition and includes the cover and manual.', '2025-02-09 14:45:00', TRUE),
    (1, 102, 'Great! Would you accept $70 for it?', '2025-02-09 15:00:00', TRUE),
    (1, 101, 'I can do $70. When would you like to meet?', '2025-02-09 15:10:00', TRUE),
    (1, 102, 'How about tomorrow at 2 PM at the UC?', '2025-02-09 15:20:00', FALSE),
    (2, 101, 'Hi Michael, I saw your listing for the Calculus textbook. Is it the 8th edition?', '2025-02-08 10:15:00', TRUE),
    (2, 103, 'Hello! Yes, it''s the 8th edition, published in 2024.', '2025-02-08 10:30:00', TRUE),
    (2, 101, 'Perfect, that''s what I need for my class. Is there any highlighting in it?', '2025-02-08 10:45:00', TRUE),
    (2, 103, 'There''s minimal highlighting in the first 3 chapters, but the rest is clean.', '2025-02-08 11:00:00', TRUE),
    (3, 104, 'Hello! I''m interested in the UTA Hoodie you''re selling. What size is it?', '2025-02-07 09:30:00', TRUE),
    (3, 101, 'Hi Emma, it''s a size Medium. It''s official UTA merchandise and has only been worn a few times.', '2025-02-07 09:45:00', TRUE),
    (3, 104, 'That''s great! I''d like to buy it. Is $30 okay?', '2025-02-07 10:00:00', TRUE);

-- Insert reports
INSERT INTO reports (type, item_id, reported_by_id, reason, status, date)
VALUES
    ('Listing', 11, 104, 'Counterfeit item', 'pending', '2025-02-08 13:20:00'),
    ('User', 106, 101, 'Harassment in messages', 'pending', '2025-02-07 15:10:00'),
    ('Listing', 14, 102, 'Selling prohibited items', 'resolved', '2025-02-06 11:45:00');

-- Insert settings
INSERT INTO settings (platform_name, support_email, items_per_page, commission_rate, min_commission)
VALUES ('UTA Market Place', 'support@utamarketplace.edu', 20, 5.00, 0.50);

-- Insert cart items (for user 101 - Test Name)
INSERT INTO cart_items (user_id, product_id, quantity)
VALUES
    (101, 1, 1),
    (101, 2, 1),
    (101, 4, 2);