const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupSupabase() {
  try {
    console.log('🚀 Setting up Supabase database...');

    // Create the execute_sql function
    const { error: functionError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE OR REPLACE FUNCTION execute_sql(query text, params jsonb DEFAULT '[]'::jsonb)
        RETURNS jsonb
        LANGUAGE plpgsql
        SECURITY DEFINER
        AS $$
        DECLARE
          result jsonb;
        BEGIN
          -- Execute the query with parameters
          EXECUTE query INTO result USING params;
          RETURN result;
        EXCEPTION
          WHEN OTHERS THEN
            RETURN jsonb_build_object('error', SQLERRM);
        END;
        $$;
      `
    });

    if (functionError) {
      console.log('Function might already exist or there was an error:', functionError.message);
    }

    // Create tables
    const tables = [
      {
        name: 'users',
        sql: `
          CREATE TABLE IF NOT EXISTS users (
            userid SERIAL PRIMARY KEY,
            username VARCHAR(20) NOT NULL UNIQUE,
            firstname VARCHAR(20) NOT NULL,
            lastname VARCHAR(20) NOT NULL,
            email VARCHAR(40) NOT NULL UNIQUE,
            user_password VARCHAR(100) NOT NULL,
            reset_otp VARCHAR(6),
            otp_expiration TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `
      },
      {
        name: 'questions',
        sql: `
          CREATE TABLE IF NOT EXISTS questions (
            id SERIAL PRIMARY KEY,
            questionid VARCHAR(100) NOT NULL UNIQUE,
            userid INT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            title VARCHAR(255) NOT NULL,
            tag VARCHAR(50),
            description TEXT NOT NULL,
            is_deleted SMALLINT DEFAULT 0,
            FOREIGN KEY (userid) REFERENCES users(userid)
          )
        `
      },
      {
        name: 'answers',
        sql: `
          CREATE TABLE IF NOT EXISTS answers (
            answerid SERIAL PRIMARY KEY,
            userid INT NOT NULL,
            questionid VARCHAR(100) NOT NULL,
            answer TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            is_deleted SMALLINT DEFAULT 0,
            FOREIGN KEY (questionid) REFERENCES questions(questionid),
            FOREIGN KEY (userid) REFERENCES users(userid)
          )
        `
      }
    ];

    for (const table of tables) {
      const { error } = await supabase.rpc('execute_sql', {
        query: table.sql
      });
      
      if (error) {
        console.log(`Table ${table.name} might already exist or there was an error:`, error.message);
      } else {
        console.log(`✅ Table ${table.name} created successfully`);
      }
    }

    console.log('✅ Supabase setup completed!');
  } catch (error) {
    console.error('❌ Supabase setup failed:', error);
  }
}

setupSupabase();
