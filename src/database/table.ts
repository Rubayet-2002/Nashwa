export const DropTable = `
    DROP TABLE IF EXISTS session;
    DROP TABLE IF EXISTS otp;
    DROP TABLE IF EXISTS shop_join_university;
    DROP TABLE IF EXISTS partner_university;
    DROP TABLE IF EXISTS selling_permit;
    DROP TABLE IF EXISTS shop;
    DROP TABLE IF EXISTS admin_key;
    DROP TABLE IF EXISTS users;
`;

export const Users = `
CREATE TABLE IF NOT EXISTS users (
    uid VARCHAR(50) PRIMARY KEY,

    profile_photo_url TEXT DEFAULT NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) DEFAULT NULL,
    university_uid VARCHAR(50) DEFAULT NULL,
    role VARCHAR(20) DEFAULT 'customer' CHECK (role IN ('customer', 'seller', 'admin')),

    auth_type VARCHAR(20) DEFAULT 'local' CHECK (auth_type IN ('local', 'google')),
    password_hash TEXT,
    google_id VARCHAR(255) UNIQUE,
    is_verified BOOLEAN DEFAULT FALSE,

    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const Shop = `
CREATE TABLE IF NOT EXISTS shop (
    shop_uid VARCHAR(50) PRIMARY KEY,
    owner_uid VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,

    shop_name VARCHAR(100) NOT NULL,
    shop_email VARCHAR(255) NOT NULL,
    shop_phone VARCHAR(20) NOT NULL,

    shop_location TEXT NOT NULL,
    shop_description TEXT NOT NULL,

    shop_bio TEXT DEFAULT NULL,
    cover_photo_url TEXT DEFAULT NULL,
    profile_photo_url TEXT DEFAULT NULL,

    nid_pdf_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ DEFAULT NULL
);
`;

export const Product = `
CREATE TABLE IF NOT EXISTS product (
    product_uid VARCHAR(50) PRIMARY KEY,
    shop_uid VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,

    title VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'BDT',

    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const ProductImage = `
CREATE TABLE IF NOT EXISTS product_image (
    id SERIAL PRIMARY KEY,
    product_uid VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    position INT DEFAULT 0
);
`;

export const OrderRequest = `
CREATE TABLE IF NOT EXISTS order_request (
    order_uid VARCHAR(50) PRIMARY KEY,
    shop_uid VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,
    buyer_uid VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,

    customer_name VARCHAR(100) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    delivery_address TEXT NOT NULL,
    note TEXT DEFAULT NULL,

    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(10) DEFAULT 'BDT',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const OrderRequestItem = `
CREATE TABLE IF NOT EXISTS order_request_item (
    id SERIAL PRIMARY KEY,
    order_uid VARCHAR(50) REFERENCES order_request(order_uid) ON DELETE CASCADE,
    product_uid VARCHAR(50) REFERENCES product(product_uid) ON DELETE SET NULL,

    product_title VARCHAR(255) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    line_total NUMERIC(12,2) NOT NULL DEFAULT 0
);
`;


export const PartnerUniversity = `
CREATE TABLE IF NOT EXISTS partner_university(
  university_uid VARCHAR(50) PRIMARY KEY,
  university_name VARCHAR(255) NOT NULL
);
`;

export const ShopJoinUniversity = `
CREATE TABLE IF NOT EXISTS shop_join_university (
    id SERIAL PRIMARY KEY,
    shop_uid VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE UNIQUE, -- Added UNIQUE directly here
    university_uid VARCHAR(50) REFERENCES partner_university(university_uid) ON DELETE CASCADE,

    sid_pdf_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved')),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ DEFAULT NULL
);
`;


export const OTP = `
CREATE TABLE IF NOT EXISTS otp (
    otp_id SERIAL PRIMARY KEY,
    user_uid VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,

    email VARCHAR(255) NOT NULL,
    otp_hash TEXT NOT NULL,
    purpose VARCHAR(30) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL
);
`;

export const Session = `
CREATE TABLE IF NOT EXISTS session (
    session_id VARCHAR(50) PRIMARY KEY,
    user_uid VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
    active_shop_uid VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE SET NULL,

    token_hash TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,

    device_type VARCHAR(255),
    device_ip INET,
    browser_name VARCHAR(255),
    os_name VARCHAR(255),

    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const AdminKey = `
CREATE TABLE IF NOT EXISTS admin_key (
    user_uid VARCHAR(50) PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,
    admin_key VARCHAR(100) UNIQUE NOT NULL
);
`;

