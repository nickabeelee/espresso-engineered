# EE Data Model Definition  
  
Espresso Engineered Project  
  
If you want to see this data model visually, navigate to this link:  
[https://dbdiagram.io/d/espresso-engineered-67f71bea4f7afba184060f4d](https://dbdiagram.io/d/espresso-engineered-67f71bea4f7afba184060f4d)  
  
```
Enum roast_level {
  Light
  Medium_Light
  Medium
  Medium_Dark
  Dark
}

Enum visibility_scope {
  public
  unlisted
  private
}

Enum suggestion_method {
  community_average
  algorithmic
  manual_override
}

Table auth_user {
  id uuid [pk]
  // Managed by Supabase Auth
}

Table barista {
  id uuid [pk, ref: > auth_user.id]
  username varchar [unique, not null]
  display_name varchar
  created_at timestamptz [default: `now()`]
  is_admin boolean [default: false]

  Note: 'Application-level user profile mapped 1:1 with Supabase auth users.'
}

Table roaster {
  id uuid [pk]
  name varchar [not null]
  website varchar
  created_at timestamptz [default: `now()`]
}

Table machine {
  id uuid [pk]
  name varchar [not null]
  manufacturer varchar
  user_manual_link varchar
  image_url varchar
  created_at timestamptz [default: `now()`]
}

Table grinder {
  id uuid [pk]
  name varchar [not null]
  manufacturer varchar
  user_manual_link varchar
  image_url varchar
  setting_guide_chart_url varchar
  created_at timestamptz [default: `now()`]
}

Table bean {
  id uuid [pk]
  name varchar [not null]
  roaster_id uuid [ref: > roaster.id, not null]
  roast_level roast_level
  country_of_origin varchar
  tasting_notes text[]
  created_at timestamptz [default: `now()`]

  Note: 'Bean definitions are communal and roaster-authored.'
}

Table bag {
  id uuid [pk]
  bean_id uuid [ref: > bean.id, not null]
  owner_id uuid [ref: > barista.id, not null]
  roast_date date
  weight_grams numeric
  price numeric
  purchase_location varchar
  created_at timestamptz [default: `now()`]

  Note: 'A bag is user-owned inventory, even if the bean is communal.'
}

Table brew {
  id uuid [pk]
  barista_id uuid [ref: > barista.id, not null]
  machine_id uuid [ref: > machine.id, not null]
  grinder_id uuid [ref: > grinder.id, not null]
  bag_id uuid [ref: > bag.id, not null]

  name varchar
  visibility visibility_scope [default: 'public']

  dose_grams numeric
  yield_grams numeric
  brew_time_seconds numeric
  grind_setting varchar

  flow_rate numeric
  ratio numeric

  rating smallint
  tasting_notes text[]
  reflections text

  created_at timestamptz [default: `now()`]
  updated_at timestamptz

  Note: 'Core experiential record. Public by default per SDD.'
}

Table brew_comparison {
  id uuid [pk]
  base_brew_id uuid [ref: > brew.id, not null]
  compare_brew_id uuid [ref: > brew.id, not null]
  barista_id uuid [ref: > barista.id, not null]
  notes text
  created_at timestamptz [default: `now()`]

  Note: 'Explicit pairwise brew comparisons.'
}

Table grinder_suggestion {
  id uuid [pk]
  grinder_id uuid [ref: > grinder.id, not null]
  machine_id uuid [ref: > machine.id, not null]

  bean_id uuid [ref: > bean.id]
  bag_id uuid [ref: > bag.id]

  normalized_setting numeric [not null]
  friendly_setting varchar

  method suggestion_method
  generated_at timestamptz [default: `now()`]

  unique (grinder_id, machine_id, bean_id, bag_id)

  Note: 'Exactly one of bean_id or bag_id must be set.'
}

Table brew_interaction {
  id uuid [pk]
  brew_id uuid [ref: > brew.id, not null]
  barista_id uuid [ref: > barista.id, not null]
  liked boolean [default: false]
  comment text
  created_at timestamptz [default: `now()`]

  Note: 'Supports likes and comments without splitting tables in the current scope.'
}

Table admin_action_log {
  id uuid [pk]
  admin_id uuid [ref: > barista.id, not null]
  target_table varchar
  target_id uuid
  action varchar
  reason text
  created_at timestamptz [default: `now()`]

  Note: 'Admin portal auditability.'
}

```
