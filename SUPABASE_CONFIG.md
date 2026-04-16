# Supabase Configuration Guide

Follow these steps to set up your Supabase project for the **Rutas App**.

## 1. Environment Variables

Create or update your `.env.local` file with the following keys from your Supabase Dashboard (**Project Settings > API**):

```env
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 2. SQL Setup

Run the following SQL commands in the **SQL Editor** of your Supabase Dashboard.

### Table: `profiles`
This table extends the default Auth users.

```sql
-- Create the profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  home_location JSONB,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own profile" 
  ON public.profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

### Table: `stops`
This table stores the delivery points.

```sql
-- Create the stops table
CREATE TABLE public.stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  address TEXT NOT NULL,
  coordinates JSONB NOT NULL,
  order_index INTEGER,
  notes TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
  is_optimized BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.stops ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can CRUD their own stops" 
  ON public.stops FOR ALL 
  USING (auth.uid() = user_id);

-- Updated_at trigger for stops
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_stops_updated_at
    BEFORE UPDATE ON public.stops
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
```

## 3. Auth Settings
In the Supabase Dashboard (**Authentication > Providers > Email**):
- Ensure **Confirm Email** is disabled (unless you have a mail server configured).
- Ensure **Allow SignUp** is enabled.
