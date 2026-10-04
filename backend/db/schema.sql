-- Schema for the resume builder. Applied idempotently by db/migrate.js.
--
-- Primary keys are CHAR(36) UUIDs rather than AUTO_INCREMENT integers. The
-- existing API already exposes opaque string ids (`_id`) to the client, so
-- UUIDs keep that contract intact and avoid leaking row counts.

CREATE TABLE IF NOT EXISTS users (
  id         CHAR(36)     NOT NULL,
  name       VARCHAR(255) NOT NULL,
  email      VARCHAR(255) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  created_at DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- Enforces the old Mongoose `unique: true`. Emails are lower-cased by the
  -- service before they reach here, so this also acts as the case-insensitive
  -- guard the application relies on.
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resumes (
  id             CHAR(36)     NOT NULL,
  user_id        CHAR(36)     NOT NULL,
  template_id    VARCHAR(191) NOT NULL DEFAULT 'china-executive-001',
  title          VARCHAR(255) NOT NULL DEFAULT 'Untitled Resume',
  summary        LONGTEXT     NULL,

  -- picture (nullable — resume can have no photo)
  picture_url    VARCHAR(500) NULL,
  -- personal info: identity fields only
  pi_fullname    VARCHAR(255) NOT NULL DEFAULT '',
  pi_role        VARCHAR(255) NOT NULL DEFAULT '',
  pi_about       LONGTEXT     NULL,
  created_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at     DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  -- ON DELETE CASCADE gives us referential integrity that Mongo could not:
  -- removing a user cannot leave orphaned resumes behind.
  CONSTRAINT fk_resumes_user FOREIGN KEY (user_id)
    REFERENCES users (id) ON DELETE CASCADE,
  -- Covers the list query, which always filters by owner and orders by
  -- updated_at DESC. Without this the resume list degrades to a full scan.
  KEY idx_resumes_user_updated (user_id, updated_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- The six repeatable sections each get their own child table.
--
-- `position` is what makes drag-and-drop reordering durable: SQL result order
-- is not guaranteed without an ORDER BY, so the row index must be stored
-- explicitly rather than inferred from insertion order.
--
-- (id, position) is unique so a bad write cannot silently produce two rows
-- claiming the same slot.

CREATE TABLE IF NOT EXISTS resume_experiences (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id CHAR(36)        NOT NULL,
  position  INT UNSIGNED    NOT NULL,
  company   VARCHAR(255)    NOT NULL DEFAULT '',
  role      VARCHAR(255)    NOT NULL DEFAULT '',
  duration  VARCHAR(255)    NOT NULL DEFAULT '',
  summary   LONGTEXT        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_experiences_slot (resume_id, position),
  CONSTRAINT fk_experiences_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resume_education (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id CHAR(36)        NOT NULL,
  position  INT UNSIGNED    NOT NULL,
  school    VARCHAR(255)    NOT NULL DEFAULT '',
  degree    VARCHAR(255)    NOT NULL DEFAULT '',
  duration  VARCHAR(255)    NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_education_slot (resume_id, position),
  CONSTRAINT fk_education_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resume_projects (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id CHAR(36)        NOT NULL,
  position  INT UNSIGNED    NOT NULL,
  title     VARCHAR(255)    NOT NULL DEFAULT '',
  tech      VARCHAR(255)    NOT NULL DEFAULT '',
  details   LONGTEXT        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_projects_slot (resume_id, position),
  CONSTRAINT fk_projects_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resume_certifications (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id CHAR(36)        NOT NULL,
  position  INT UNSIGNED    NOT NULL,
  name      VARCHAR(255)    NOT NULL DEFAULT '',
  issuer    VARCHAR(255)    NOT NULL DEFAULT '',
  year      VARCHAR(50)     NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_certifications_slot (resume_id, position),
  CONSTRAINT fk_certifications_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resume_languages (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id CHAR(36)        NOT NULL,
  position  INT UNSIGNED    NOT NULL,
  name      VARCHAR(255)    NOT NULL DEFAULT '',
  level     VARCHAR(255)    NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_languages_slot (resume_id, position),
  CONSTRAINT fk_languages_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resume_custom_sections (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id CHAR(36)        NOT NULL,
  position  INT UNSIGNED    NOT NULL,
  title     VARCHAR(255)    NOT NULL DEFAULT '',
  details   LONGTEXT        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_custom_sections_slot (resume_id, position),
  CONSTRAINT fk_custom_sections_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS templates (
  id            CHAR(36)     NOT NULL,
  -- The human-readable slug ("china-executive-001"). The frontend matches
  -- templates on this, while `id` remains the surrogate key exposed as `_id`.
  slug          VARCHAR(191) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  layout_style  VARCHAR(100) NOT NULL DEFAULT 'modern',
  -- ENUM mirrors the old Mongoose enum so invalid categories are rejected by
  -- the database, not just by application code.
  category      ENUM('Corporate','Executive','Tech','Creative') NOT NULL,
  description   VARCHAR(500) NULL,
  -- JSON columns for the two free-form structures. `tags` is a string array and
  -- `styling` a flat map of class strings; both are read whole and never
  -- queried by element, so normalising them would add joins for no benefit.
  tags          JSON         NULL,
  styling       JSON         NULL,
  preview_image VARCHAR(500) NULL,
  has_photo     TINYINT(1)   NOT NULL DEFAULT 0,
  columns       TINYINT      NOT NULL DEFAULT 1,
  style         VARCHAR(50)  NOT NULL DEFAULT 'contemporary',
  occupation    VARCHAR(100) NOT NULL DEFAULT '',
  is_active     TINYINT(1)   NOT NULL DEFAULT 1,
  version       INT          NOT NULL DEFAULT 1,
  popularity    INT          NOT NULL DEFAULT 0,
  created_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at    DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (id),
  UNIQUE KEY uq_templates_slug (slug),
  -- Mirrors the old compound index { category, isActive, popularity }.
  KEY idx_templates_category_active_pop (category, is_active, popularity DESC),
  KEY idx_templates_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

# job circular
  

#  requirement 


-- Contact information is normalised into its own table.
-- One-to-one with resumes: every resume has exactly one contact row,
-- created atomically with the resume and deleted via ON DELETE CASCADE.
CREATE TABLE IF NOT EXISTS resume_contact (
  id        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id CHAR(36)        NOT NULL,
  email     VARCHAR(255)    NOT NULL DEFAULT '',
  phone     VARCHAR(100)    NOT NULL DEFAULT '',
  location  VARCHAR(255)    NOT NULL DEFAULT '',
  address   VARCHAR(255)    NOT NULL DEFAULT '',
  website   VARCHAR(255)    NOT NULL DEFAULT '',
  linkedin  VARCHAR(255)    NOT NULL DEFAULT '',
  twitter   VARCHAR(255)    NOT NULL DEFAULT '',
  github    VARCHAR(255)    NOT NULL DEFAULT '',
  PRIMARY KEY (id),
  UNIQUE KEY uq_contact_resume (resume_id),
  CONSTRAINT fk_contact_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS resume_skills (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  resume_id  CHAR(36)        NOT NULL,
  position   INT UNSIGNED    NOT NULL,
  skill_name VARCHAR(255)    NOT NULL DEFAULT '',
  summary    LONGTEXT        NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_skills_slot (resume_id, position),
  CONSTRAINT fk_skills_resume FOREIGN KEY (resume_id)
    REFERENCES resumes (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

