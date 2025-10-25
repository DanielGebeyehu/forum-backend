const { createClient } = require("@supabase/supabase-js");

if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to convert MySQL-style queries to Supabase operations
const query = async (text, params = []) => {
  console.warn(
    "⚠️ Using legacy query function. Consider migrating to Supabase methods."
  );

  // Parse simple SELECT queries
  const selectMatch = text.match(/SELECT \* FROM (\w+) WHERE (\w+) = \?/i);
  if (selectMatch) {
    const [, table, column] = selectMatch;
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq(column, params[0]);

    if (error) throw error;
    return { rows: data || [] };
  }

  // Parse INSERT queries
  const insertMatch = text.match(
    /INSERT INTO (\w+) \((.*?)\) VALUES \((.*?)\)/i
  );
  if (insertMatch) {
    const [, table, columns] = insertMatch;
    const columnNames = columns.split(",").map((c) => c.trim());
    const insertData = {};
    columnNames.forEach((col, i) => {
      insertData[col] = params[i];
    });

    const { data, error } = await supabase
      .from(table)
      .insert(insertData)
      .select();

    if (error) throw error;
    return { rows: data || [] };
  }

  throw new Error("Query not supported. Please use Supabase native methods.");
};

module.exports = {
  query,
  supabase,
};

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
