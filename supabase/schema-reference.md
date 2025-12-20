# Supabase Database Schema Reference

**Project ID:** fobpgsqvotpeagrczcsq  
**Project Name:** espresso-engineered  
**Region:** us-west-2  
**Status:** ACTIVE_HEALTHY  
**Database Version:** PostgreSQL 17.6.1.062  

## Tables Overview

All tables have RLS (Row Level Security) enabled.

### 1. roaster
**Purpose:** Companies or individuals who roast the beans that we love to brew.

| Column | Type | Options | Default |
|--------|------|---------|---------|
| id | uuid | primary key | gen_random_uuid() |
| created_at | timestamptz | updatable | now() |
| modified_at | timestamptz | updatable | now() |
| name | text | updatable, unique | - |
| website_url | text | nullable, updatable | - |

**Foreign Key References:**
- Referenced by: `bean.roaster_id`

---

### 2. bean
**Purpose:** Named beans or roasts from roasters. Useful for when multiple baristas use the same bean and want to compare notes.

| Column | Type | Options | Default |
|--------|------|---------|---------|
| id | uuid | primary key | gen_random_uuid() |
| created_at | timestamptz | updatable | now() |
| modified_at | timestamptz | updatable | now() |
| roaster_id | uuid | nullable, updatable | - |
| name | text | updatable | - |
| roast_level | roast_levels enum | updatable | - |
| country_of_origin | varchar | nullable, updatable | - |
| tasting_notes | text | nullable, updatable | - |

**Enum Values for roast_level:**
- Dark
- Medium Dark  
- Medium
- Medium Light
- Light

**Foreign Key References:**
- References: `roaster.id`
- Referenced by: `bag.bean_id`

---

### 3. barista
**Purpose:** Baristas who create brews and own bags. One-to-one with auth.users table.

| Column | Type | Options | Default |
|--------|------|---------|---------|
| id | uuid | primary key | - |
| created_at | timestamptz | updatable | now() |
| email | text | updatable, unique | - |
| first_name | text | updatable | - |
| last_name | text | updatable | - |
| display_name | text | updatable, unique | - |
| is_admin | boolean | updatable | false |

**Foreign Key References:**
- References: `auth.users.id` (via foreign key constraint)
- Referenced by: `bag.owner_id`, `brew.barista_id`

---

### 4. grinder
**Purpose:** Essential equipment component in the brew preparation arsenal.

| Column | Type | Options | Default |
|--------|------|---------|---------|
| id | uuid | primary key | gen_random_uuid() |
| created_at | timestamptz | updatable | now() |
| modified_at | timestamptz | nullable, updatable | now() |
| name | text | updatable | - |
| manufacturer | text | nullable, updatable | - |
| image_path | text | nullable, updatable | - |
| setting_guide_chart_url | text | nullable, updatable | - |

**Foreign Key References:**
- Referenced by: `brew.grinder_id`

---

### 5. machine
**Purpose:** The actual espresso machine used to create the brew (manual press, Breville Bambino, professional La Mar, etc.).

| Column | Type | Options | Default |
|--------|------|---------|---------|
| id | uuid | primary key | gen_random_uuid() |
| created_at | timestamptz | updatable | now() |
| modified_at | timestamptz | updatable | now() |
| name | text | updatable | - |
| manufacturer | text | nullable, updatable | - |
| user_manual_link | text | nullable, updatable | - |
| image_path | text | nullable, updatable | - |

**Foreign Key References:**
- Referenced by: `brew.machine_id`

---

### 6. bag
**Purpose:** Bags of beans bought from roasters or retailers. These run out eventually and need to be restocked.

| Column | Type | Options | Default |
|--------|------|---------|---------|
| id | uuid | primary key | gen_random_uuid() |
| created_at | timestamptz | updatable | now() |
| modified_at | timestamptz | updatable | now() |
| bean_id | uuid | updatable | - |
| owner_id | uuid | updatable | - |
| roast_date | date | nullable, updatable | - |
| weight_mg | numeric | nullable, updatable | - |
| price | numeric | nullable, updatable | - |
| purchase_location | text | nullable, updatable | - |

**Foreign Key References:**
- References: `bean.id`, `barista.id`
- Referenced by: `brew.bag_id`

---

### 7. brew
**Purpose:** The works of art created by the baristas... all the work culminates here using machines, bags of beans, grinders, etc.

| Column | Type | Options | Default |
|--------|------|---------|---------|
| id | uuid | primary key | gen_random_uuid() |
| created_at | timestamptz | updatable | now() |
| modified_at | timestamptz | updatable | now() |
| barista_id | uuid | updatable | - |
| machine_id | uuid | updatable | - |
| grinder_id | uuid | updatable | - |
| bag_id | uuid | updatable | - |
| name | text | updatable | - |
| dose_mg | numeric | updatable | - |
| yield_mg | numeric | nullable, updatable | - |
| brew_time_ms | numeric | nullable, updatable | - |
| grind_setting | varchar | nullable, updatable | - |
| flow_rate_mg/s | numeric | nullable, updatable | - |
| ratio_dec | numeric | nullable, updatable | - |
| rating | integer | nullable, updatable | - |
| tasting_notes | text | nullable, updatable | - |
| reflections | text | nullable, updatable | - |

**Foreign Key References:**
- References: `barista.id`, `machine.id`, `grinder.id`, `bag.id`

## Key Observations for Image Upload Implementation

1. **Both `grinder` and `machine` tables already have `image_path` columns** - this is perfect for our image upload implementation
2. **The `image_path` field is nullable and updatable** - supports optional images and replacement
3. **No current storage bucket configuration visible** - we'll need to set up Supabase Storage
4. **RLS is enabled on all tables** - need to ensure proper policies for image operations

## Next Steps for Image Upload Implementation

1. Set up Supabase Storage bucket for equipment images
2. Create RLS policies for the storage bucket
3. Implement backend image upload endpoints
4. Update frontend components to support file uploads instead of just URLs
5. Add image validation and processing utilities
