-- Enable PostGIS for spatial queries (nearby places, radius searches)
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID extension for unique primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
