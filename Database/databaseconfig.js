const { createClient } = require("@supabase/supabase-js");

// Only load .env in development
if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Query wrapper to handle PostgreSQL queries
const query = async (text, params = []) => {
  const cleanText = text.trim();

  // Handle connection test
  if (cleanText.match(/SELECT NOW\(\)/i)) {
    return { rows: [{ now: new Date() }] };
  }

  // Handle CREATE TABLE (Supabase tables should be created via dashboard/SQL editor)
  if (cleanText.match(/CREATE TABLE IF NOT EXISTS/i)) {
    console.log("⚠️ Table creation skipped - create tables in Supabase dashboard");
    return { rows: [] };
  }

  // Handle SELECT queries
  const selectMatch = cleanText.match(
    /SELECT \* FROM (\w+)(?: WHERE (\w+) = \$1)?/i
  );
  if (selectMatch) {
    const [, table, column] = selectMatch;
    let queryBuilder = supabase.from(table).select("*");

    if (column && params[0] !== undefined) {
      queryBuilder = queryBuilder.eq(column, params[0]);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return { rows: data || [] };
  }

  // Handle INSERT queries
  const insertMatch = cleanText.match(
    /INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((.*?)\)\s*RETURNING \*/i
  );
  if (insertMatch) {
    const [, table, columns] = insertMatch;
    const columnNames = columns.split(",").map((c) => c.trim());
    const insertData = {};

    columnNames.forEach((col, i) => {
      if (params[i] !== undefined) {
        insertData[col] = params[i];
      }
    });

    const { data, error } = await supabase
      .from(table)
      .insert(insertData)
      .select();

    if (error) throw error;
    return { rows: data || [] };
  }

  // Handle UPDATE queries
  const updateMatch = cleanText.match(
    /UPDATE (\w+) SET (.*?) WHERE (\w+) = \$(\d+)/i
  );
  if (updateMatch) {
    const [, table, setClause, whereColumn, whereParamIndex] = updateMatch;
    const updates = {};

    // Parse SET clause
    const setPairs = setClause.split(",");
    let paramIndex = 0;
    setPairs.forEach((pair) => {
      const [col] = pair.trim().split("=");
      updates[col.trim()] = params[paramIndex++];
    });

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq(whereColumn, params[parseInt(whereParamIndex) - 1])
      .select();

    if (error) throw error;
    return { rows: data || [] };
  }

  // Handle DELETE queries
  const deleteMatch = cleanText.match(/DELETE FROM (\w+) WHERE (\w+) = \$1/i);
  if (deleteMatch) {
    const [, table, column] = deleteMatch;
    const { error } = await supabase.from(table).delete().eq(column, params[0]);

    if (error) throw error;
    return { rows: [] };
  }

  console.error("❌ Unsupported query:", cleanText);
  throw new Error(
    `Query pattern not supported. Please use Supabase native methods.`
  );
};

module.exports = {
  query,
  supabase,
};

//----------------------------------------------------------------------
// const { createClient } = require('@supabase/supabase-js');

// // Only load .env in development
// if (process.env.NODE_ENV !== "production") {
//   require("dotenv").config();
// }

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseKey = process.env.SUPABASE_ANON_KEY;

// if (!supabaseUrl || !supabaseKey) {
//   throw new Error('Missing Supabase environment variables');
// }

// const supabase = createClient(supabaseUrl, supabaseKey);

// // Create a query wrapper to maintain compatibility with existing code
// const query = async (text, params = []) => {
//   try {
//     // Use Supabase's RPC function for raw SQL queries
//     const { data, error } = await supabase.rpc('execute_sql', {
//       query: text,
//       params: params
//     });

//     if (error) {
//       console.error('Supabase query error:', error);
//       throw error;
//     }

//     return { rows: data || [] };
//   } catch (error) {
//     console.error('Database query error:', error);
//     throw error;
//   }
// };

// module.exports = {
//   query,
//   supabase
// };

// // const mysql2 = require("mysql2");

// // // Only load .env in development (not in production)
// // if (process.env.NODE_ENV !== "production") {
// //   require("dotenv").config();
// // }

// // const dbconnection = mysql2.createPool({
// //   host: process.env.DB_HOST,
// //   user: process.env.DB_USER,
// //   password: process.env.DB_PASSWORD,
// //   database: process.env.DB_NAME,
// //   port: process.env.DB_PORT || 3306,
// // });

// // module.exports = dbconnection.promise();

// // const mysql2 = require("mysql2");
// // const dotenv = require("dotenv");
// // dotenv.config();

// // const dbconnection = mysql2.createPool({
// //   host: process.env.DB_HOST,
// //   user: process.env.DB_USER,
// //   password: process.env.DB_PASSWORD,
// //   database: process.env.DB_NAME,
// // });

// // module.exports = dbconnection.promise();
