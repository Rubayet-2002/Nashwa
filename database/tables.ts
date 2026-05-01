export const DropTableStatements = [
    "DROP TABLE IF EXISTS seller_profiles CASCADE;",
    "DROP TABLE IF EXISTS shops CASCADE;",
    "DROP TABLE IF EXISTS sessions CASCADE;",
    "DROP TABLE IF EXISTS otp CASCADE;",
    "DROP TABLE IF EXISTS users CASCADE;",
];


export const UserTable = `
CREATE TABLE IF NOT EXISTS users (

    uid VARCHAR(50) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),

    username VARCHAR(50),
    role VARCHAR(20) DEFAULT 'customer',
    avatar_url TEXT,

    password_hash TEXT,
    google_id VARCHAR(255) UNIQUE,
    auth_type VARCHAR(20) DEFAULT 'local',
    is_verified BOOLEAN DEFAULT FALSE,

    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const SellerProfileTable = `
CREATE TABLE IF NOT EXISTS seller_profiles (

    seller_id VARCHAR(50) PRIMARY KEY REFERENCES users(uid) ON DELETE CASCADE,

    university_name VARCHAR(100) NOT NULL,

    nid_pdf_url TEXT,
    student_card_pdf_url TEXT,

    verification_status VARCHAR(20) DEFAULT 'pending',
    applied_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const ShopTable = `
CREATE TABLE IF NOT EXISTS shops (
    shop_id SERIAL PRIMARY KEY,
    owner_id VARCHAR(50) UNIQUE REFERENCES users(uid) ON DELETE CASCADE,

    shop_name VARCHAR(100) NOT NULL,
    description TEXT,
    location_map_url TEXT,
    cover_photo_url TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW()
);
`;

export const SessionTable = `
CREATE TABLE IF NOT EXISTS sessions (

    session_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,

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

export const OTPTable = `
CREATE TABLE IF NOT EXISTS otp (

    otp_id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,

    otp_hash TEXT NOT NULL,
    purpose VARCHAR(30) NOT NULL,

    expires_at TIMESTAMPTZ NOT NULL
);
`;

export const CreateTableStatements = [
    UserTable,
    SellerProfileTable,
    ShopTable,
    SessionTable,
    OTPTable,
];
