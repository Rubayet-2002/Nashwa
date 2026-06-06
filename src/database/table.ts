// ============================================================
// NASHWA — Full Database Schema
// Run: npm run db  (drops all, creates all, seeds admin + universities)
// ============================================================

// ---- DROP ORDER (reverse dependency) ----
export const DropAll = `
  DROP TABLE IF EXISTS comment_reaction CASCADE;
  DROP TABLE IF EXISTS product_review CASCADE;
  DROP TABLE IF EXISTS product_save CASCADE;
  DROP TABLE IF EXISTS report CASCADE;
  DROP TABLE IF EXISTS notification CASCADE;
  DROP TABLE IF EXISTS event_product CASCADE;
  DROP TABLE IF EXISTS campus_event CASCADE;
  DROP TABLE IF EXISTS order_request_item CASCADE;
  DROP TABLE IF EXISTS order_request CASCADE;
  DROP TABLE IF EXISTS chat_message CASCADE;
  DROP TABLE IF EXISTS product_reaction CASCADE;
  DROP TABLE IF EXISTS product_comment CASCADE;
  DROP TABLE IF EXISTS product_image CASCADE;
  DROP TABLE IF EXISTS product CASCADE;
  DROP TABLE IF EXISTS university_favorite CASCADE;
  DROP TABLE IF EXISTS shop_follow CASCADE;
  DROP TABLE IF EXISTS shop_join_university CASCADE;
  DROP TABLE IF EXISTS partner_university CASCADE;
  DROP TABLE IF EXISTS shop CASCADE;
  DROP TABLE IF EXISTS otp CASCADE;
  DROP TABLE IF EXISTS session CASCADE;
  DROP TABLE IF EXISTS users CASCADE;
`;

// ---- USERS ----
export const Users = `
CREATE TABLE IF NOT EXISTS users (
  uid               VARCHAR(50) PRIMARY KEY,
  profile_photo_url TEXT DEFAULT NULL,
  cover_photo_url   TEXT DEFAULT NULL,
  username          VARCHAR(50) NOT NULL,
  email             VARCHAR(255) UNIQUE NOT NULL,
  phone             VARCHAR(20) DEFAULT NULL,

  role              VARCHAR(20) DEFAULT 'customer'
                    CHECK (role IN ('customer', 'seller', 'admin')),
  auth_type         VARCHAR(20) DEFAULT 'local'
                    CHECK (auth_type IN ('local', 'google')),

  password_hash     TEXT,
  google_id         VARCHAR(255) UNIQUE,
  is_verified       BOOLEAN DEFAULT FALSE,

  bio               TEXT DEFAULT NULL,
  address           TEXT DEFAULT NULL,
  city              VARCHAR(100) DEFAULT NULL,
  postal_code       VARCHAR(20) DEFAULT NULL,

  last_login        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- SESSION ----
export const Session = `
CREATE TABLE IF NOT EXISTS session (
  session_id        VARCHAR(50) PRIMARY KEY,
  user_uid          VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  active_shop_uid   VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE SET NULL,

  token_hash        TEXT NOT NULL UNIQUE,
  expires_at        TIMESTAMPTZ NOT NULL,
  is_revoked        BOOLEAN DEFAULT FALSE,

  device_type       VARCHAR(255),
  device_ip         INET,
  browser_name      VARCHAR(255),
  os_name           VARCHAR(255),

  created_at        TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- OTP ----
export const OTP = `
CREATE TABLE IF NOT EXISTS otp (
  otp_id            SERIAL PRIMARY KEY,
  user_uid          VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  email             VARCHAR(255) NOT NULL,
  otp_hash          TEXT NOT NULL,
  purpose           VARCHAR(30) NOT NULL,
  expires_at        TIMESTAMPTZ NOT NULL
);
`;

// ---- PARTNER UNIVERSITY (Community) ----
export const PartnerUniversity = `
CREATE TABLE IF NOT EXISTS partner_university (
  university_uid    VARCHAR(50) PRIMARY KEY,
  university_name   VARCHAR(255) NOT NULL,
  subtitle          VARCHAR(255) DEFAULT NULL,
  description       TEXT DEFAULT NULL,
  logo_url          TEXT DEFAULT NULL,
  cover_url         TEXT DEFAULT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- SHOP ----
export const Shop = `
CREATE TABLE IF NOT EXISTS shop (
  shop_uid            VARCHAR(50) PRIMARY KEY,
  owner_uid           VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,

  shop_name           VARCHAR(100) NOT NULL,
  shop_email          VARCHAR(255) NOT NULL,
  shop_phone          VARCHAR(20) NOT NULL,
  shop_location       TEXT NOT NULL,
  shop_description    TEXT NOT NULL,
  shop_bio            TEXT DEFAULT NULL,

  cover_photo_url     TEXT DEFAULT NULL,
  profile_photo_url   TEXT DEFAULT NULL,
  nid_pdf_url         TEXT NOT NULL,

  instagram_url       TEXT DEFAULT NULL,
  facebook_url        TEXT DEFAULT NULL,
  whatsapp            VARCHAR(30) DEFAULT NULL,

  status              VARCHAR(20) DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'rejected')),

  avg_rating          NUMERIC(3,2) DEFAULT 0,
  follower_count      INT DEFAULT 0,
  total_sales         INT DEFAULT 0,
  total_revenue       NUMERIC(14,2) DEFAULT 0,

  platform_debt       NUMERIC(14,2) DEFAULT 0,
  last_payment_at     TIMESTAMPTZ DEFAULT NULL,
  is_blocked          BOOLEAN DEFAULT FALSE,

  created_at          TIMESTAMPTZ DEFAULT NOW(),
  approved_at         TIMESTAMPTZ DEFAULT NULL
);
`;

// ---- SHOP FOLLOW ----
export const ShopFollow = `
CREATE TABLE IF NOT EXISTS shop_follow (
  shop_uid      VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,
  user_uid      VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (shop_uid, user_uid)
);
`;

// ---- SHOP JOIN UNIVERSITY ----
export const ShopJoinUniversity = `
CREATE TABLE IF NOT EXISTS shop_join_university (
  id              SERIAL PRIMARY KEY,
  shop_uid        VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE UNIQUE,
  university_uid  VARCHAR(50) REFERENCES partner_university(university_uid) ON DELETE CASCADE,
  student_id      VARCHAR(100) DEFAULT NULL,
  sid_pdf_url     TEXT NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  approved_at     TIMESTAMPTZ DEFAULT NULL
);
`;

// ---- UNIVERSITY FAVORITE (users add universities to favorites) ----
export const UniversityFavorite = `
CREATE TABLE IF NOT EXISTS university_favorite (
  university_uid  VARCHAR(50) REFERENCES partner_university(university_uid) ON DELETE CASCADE,
  user_uid        VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (university_uid, user_uid)
);
`;

// ---- PRODUCT ----
export const Product = `
CREATE TABLE IF NOT EXISTS product (
  product_uid             VARCHAR(50) PRIMARY KEY,
  shop_uid                VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,

  title                   VARCHAR(255) NOT NULL,
  description             TEXT,
  category                VARCHAR(100) DEFAULT NULL,

  product_type            VARCHAR(20) DEFAULT 'regular'
                          CHECK (product_type IN ('regular', 'preorder', 'event')),

  price                   NUMERIC(12,2) NOT NULL DEFAULT 0,
  original_price          NUMERIC(12,2) DEFAULT NULL,
  discount_percent        NUMERIC(5,2) DEFAULT 0,
  currency                VARCHAR(10) DEFAULT 'BDT',

  inside_delivery_charge  NUMERIC(10,2) DEFAULT 0,
  outside_delivery_charge NUMERIC(10,2) DEFAULT 0,
  free_on_campus_delivery BOOLEAN DEFAULT FALSE,

  variants                JSONB DEFAULT '[]',
  product_details         JSONB DEFAULT '[]',

  status                  VARCHAR(20) DEFAULT 'active'
                          CHECK (status IN ('active', 'removed', 'blocked', 'event_pending')),

  sold_count              INT DEFAULT 0,
  share_count             INT DEFAULT 0,
  like_count              INT DEFAULT 0,
  avg_rating              NUMERIC(3,2) DEFAULT 0,

  created_at              TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- PRODUCT IMAGE ----
export const ProductImage = `
CREATE TABLE IF NOT EXISTS product_image (
  id            SERIAL PRIMARY KEY,
  product_uid   VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
  image_url     TEXT NOT NULL,
  position      INT DEFAULT 0
);
`;

// ---- PRODUCT REACTION (likes) ----
export const ProductReaction = `
CREATE TABLE IF NOT EXISTS product_reaction (
  reaction_uid  VARCHAR(50) PRIMARY KEY,
  product_uid   VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
  user_uid      VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  reaction_type VARCHAR(20) NOT NULL DEFAULT 'like',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_uid, user_uid)
);
`;

// ---- PRODUCT SAVE ----
export const ProductSave = `
CREATE TABLE IF NOT EXISTS product_save (
  product_uid   VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
  user_uid      VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (product_uid, user_uid)
);
`;

// ---- PRODUCT COMMENT ----
export const ProductComment = `
CREATE TABLE IF NOT EXISTS product_comment (
  comment_uid         VARCHAR(50) PRIMARY KEY,
  product_uid         VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
  author_uid          VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
  author_role         VARCHAR(20) NOT NULL DEFAULT 'customer',
  author_name         VARCHAR(255) NOT NULL,
  author_photo_url    TEXT DEFAULT NULL,
  comment_text        TEXT NOT NULL,
  parent_comment_uid  VARCHAR(50) REFERENCES product_comment(comment_uid) ON DELETE CASCADE,
  reply_to_name       VARCHAR(255) DEFAULT NULL,
  like_count          INT DEFAULT 0,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- COMMENT REACTION (likes on comments) ----
export const CommentReaction = `
CREATE TABLE IF NOT EXISTS comment_reaction (
  comment_uid   VARCHAR(50) REFERENCES product_comment(comment_uid) ON DELETE CASCADE,
  user_uid      VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (comment_uid, user_uid)
);
`;

// ---- PRODUCT REVIEW (post-purchase) ----
export const ProductReview = `
CREATE TABLE IF NOT EXISTS product_review (
  review_uid    VARCHAR(50) PRIMARY KEY,
  product_uid   VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
  order_uid     VARCHAR(50) DEFAULT NULL,
  user_uid      VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
  rating        INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text   TEXT DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (product_uid, user_uid)
);
`;

// ---- ORDER REQUEST ----
export const OrderRequest = `
CREATE TABLE IF NOT EXISTS order_request (
  order_uid         VARCHAR(50) PRIMARY KEY,
  shop_uid          VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,
  buyer_uid         VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,

  customer_name     VARCHAR(100) NOT NULL,
  customer_email    VARCHAR(255) NOT NULL,
  customer_phone    VARCHAR(30) NOT NULL,
  delivery_address  TEXT NOT NULL,
  city              VARCHAR(100) DEFAULT NULL,
  postal_code       VARCHAR(20) DEFAULT NULL,
  note              TEXT DEFAULT NULL,

  delivery_type     VARCHAR(30) DEFAULT 'standard'
                    CHECK (delivery_type IN ('standard', 'on_campus')),
  payment_method    VARCHAR(30) DEFAULT 'cod'
                    CHECK (payment_method IN ('cod')),

  subtotal          NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_charge   NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
  platform_fee      NUMERIC(12,2) NOT NULL DEFAULT 0,
  currency          VARCHAR(10) DEFAULT 'BDT',

  status            VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- ORDER REQUEST ITEM ----
export const OrderRequestItem = `
CREATE TABLE IF NOT EXISTS order_request_item (
  id              SERIAL PRIMARY KEY,
  order_uid       VARCHAR(50) REFERENCES order_request(order_uid) ON DELETE CASCADE,
  product_uid     VARCHAR(50) REFERENCES product(product_uid) ON DELETE SET NULL,
  product_title   VARCHAR(255) NOT NULL,
  variant         VARCHAR(255) DEFAULT NULL,
  unit_price      NUMERIC(12,2) NOT NULL,
  quantity        INT NOT NULL DEFAULT 1,
  line_total      NUMERIC(12,2) NOT NULL DEFAULT 0
);
`;

// ---- CHAT MESSAGE (user ↔ shop only) ----
export const ChatMessage = `
CREATE TABLE IF NOT EXISTS chat_message (
  message_uid       VARCHAR(50) PRIMARY KEY,
  sender_uid        VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  receiver_uid      VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  shop_uid          VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,
  sender_role       VARCHAR(20) NOT NULL DEFAULT 'customer'
                    CHECK (sender_role IN ('customer', 'seller')),
  product_ref_uid   VARCHAR(50) REFERENCES product(product_uid) ON DELETE SET NULL,

  message_type      VARCHAR(30) DEFAULT 'text'
                    CHECK (message_type IN ('text', 'image', 'product_ref')),
  message_text      TEXT NOT NULL,
  image_url         TEXT DEFAULT NULL,

  is_read           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- NOTIFICATION ----
export const Notification = `
CREATE TABLE IF NOT EXISTS notification (
  notif_uid     VARCHAR(50) PRIMARY KEY,
  user_uid      VARCHAR(50) REFERENCES users(uid) ON DELETE CASCADE,
  shop_uid      VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE DEFAULT NULL,
  type          VARCHAR(50) NOT NULL,
  title         VARCHAR(255) NOT NULL,
  body          TEXT NOT NULL,
  link          TEXT DEFAULT NULL,
  image_url     TEXT DEFAULT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- CAMPUS EVENT (admin-created or shop-hosted) ----
export const CampusEvent = `
CREATE TABLE IF NOT EXISTS campus_event (
  event_uid     VARCHAR(50) PRIMARY KEY,
  admin_uid     VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
  shop_uid      VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE DEFAULT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT,
  image_url     TEXT,
  host_name     VARCHAR(255) DEFAULT NULL,
  venue         VARCHAR(255) NOT NULL,
  start_at      TIMESTAMPTZ DEFAULT NOW(),
  ends_at       TIMESTAMPTZ NOT NULL,
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
`;

// ---- EVENT PRODUCT (products submitted to an event) ----
export const EventProduct = `
CREATE TABLE IF NOT EXISTS event_product (
  id            SERIAL PRIMARY KEY,
  event_uid     VARCHAR(50) REFERENCES campus_event(event_uid) ON DELETE CASCADE,
  product_uid   VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
  shop_uid      VARCHAR(50) REFERENCES shop(shop_uid) ON DELETE CASCADE,
  status        VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_at   TIMESTAMPTZ DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_uid, product_uid)
);
`;

// ---- REPORT ----
export const Report = `
CREATE TABLE IF NOT EXISTS report (
  report_uid    VARCHAR(50) PRIMARY KEY,
  reporter_uid  VARCHAR(50) REFERENCES users(uid) ON DELETE SET NULL,
  product_uid   VARCHAR(50) REFERENCES product(product_uid) ON DELETE CASCADE,
  reason        TEXT NOT NULL,
  status        VARCHAR(20) DEFAULT 'pending'
                CHECK (status IN ('pending', 'resolved', 'dismissed')),
  action_taken  TEXT DEFAULT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
`;
