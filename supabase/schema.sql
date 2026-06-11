-- schema.sql
-- InnoVibe Mobility CRM Schema

-- 1. customers
CREATE TABLE customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. vehicles
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  registration_number TEXT UNIQUE NOT NULL,
  battery_serial TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  battery_health TEXT,
  amc_status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. garages
CREATE TABLE garages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  capacity INT DEFAULT 5,
  available_slots INT DEFAULT 5,
  rating DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. technicians
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  skills TEXT[],
  availability TEXT DEFAULT 'available',
  current_assignments INT DEFAULT 0,
  garage_id UUID REFERENCES garages(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. bookings
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled');

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  issue_type TEXT,
  issue_description TEXT,
  booking_source TEXT,
  preferred_slot TIMESTAMP WITH TIME ZONE,
  assigned_garage_id UUID REFERENCES garages(id),
  assigned_technician_id UUID REFERENCES technicians(id),
  status booking_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. complaints
CREATE TYPE complaint_status AS ENUM ('open', 'investigating', 'resolved', 'closed');

CREATE TABLE complaints (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id),
  customer_id UUID REFERENCES customers(id),
  category TEXT,
  severity TEXT,
  description TEXT,
  media_urls TEXT[],
  assigned_to UUID REFERENCES technicians(id), -- Or users table
  resolution_notes TEXT,
  status complaint_status DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. service_history
CREATE TABLE service_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  completion_date TIMESTAMP WITH TIME ZONE,
  work_done TEXT,
  parts_changed TEXT[],
  cost DECIMAL(10,2),
  technician_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. amc_plans
CREATE TABLE amc_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  vehicle_id UUID REFERENCES vehicles(id),
  plan_name TEXT,
  start_date DATE,
  expiry_date DATE,
  payment_status TEXT,
  renewal_due DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  customer_type TEXT,
  score INT DEFAULT 0,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. reminder_queue
CREATE TABLE reminder_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES customers(id),
  reminder_type TEXT,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_status TEXT DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE
);

-- 11. audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID, -- References auth.users or internal users table
  action TEXT,
  entity TEXT,
  entity_id UUID,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
