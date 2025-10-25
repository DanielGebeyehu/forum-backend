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

// Query wrapper to handle common PostgreSQL queries
const query = async (text, params = []) => {
  const cleanText = text.trim();

  // Handle connection test
  if (cleanText.match(/SELECT NOW\(\)/i)) {
    return { rows: [{ now: new Date() }] };
  }

  // Handle CREATE TABLE (Supabase tables should be created via dashboard/SQL editor)
  if (cleanText.match(/CREATE TABLE IF NOT EXISTS/i)) {
    console.log(
      "⚠️ Table creation skipped - create tables in Supabase dashboard"
    );
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
//---------------------------------------------------------
// const express = require("express");
// const cors = require("cors");
// const sendEmail = require("./utils/emailSender");
// const app = express();
// const PORT = process.env.PORT || 5000;
// app.use(express.json());

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:5174",
//       "http://localhost:5175",
//       "https://2025-evangadi-forum-project.netlify.app",
//     ],
//     credentials: true,
//   })
// );

// // database connection
// const dbconnection = require("./Database/databaseconfig");

// // Create tables function
// async function createTablesIfNotExist() {
//   try {
//     // Create users table
//     await dbconnection.query(`
//       CREATE TABLE IF NOT EXISTS users (
//         userid SERIAL PRIMARY KEY,
//         username VARCHAR(20) NOT NULL UNIQUE,
//         firstname VARCHAR(20) NOT NULL,
//         lastname VARCHAR(20) NOT NULL,
//         email VARCHAR(40) NOT NULL UNIQUE,
//         user_password VARCHAR(100) NOT NULL,
//         reset_otp VARCHAR(6),
//         otp_expiration TIMESTAMP
//       )
//     `);

//     // Create questions table
//     await dbconnection.query(`
//       CREATE TABLE IF NOT EXISTS questions (
//         id SERIAL PRIMARY KEY,
//         questionid VARCHAR(100) NOT NULL UNIQUE,
//         userid INT NOT NULL,
//         created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
//         title VARCHAR(255) NOT NULL,
//         tag VARCHAR(50),
//         description TEXT NOT NULL,
//         is_deleted SMALLINT DEFAULT 0,
//         FOREIGN KEY (userid) REFERENCES users(userid)
//       )
//     `);

//     // Create answers table
//     await dbconnection.query(`
//       CREATE TABLE IF NOT EXISTS answers (
//         answerid SERIAL PRIMARY KEY,
//         userid INT NOT NULL,
//         questionid VARCHAR(100) NOT NULL,
//         answer TEXT NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         is_deleted SMALLINT DEFAULT 0,
//         FOREIGN KEY (questionid) REFERENCES questions(questionid),
//         FOREIGN KEY (userid) REFERENCES users(userid)
//       )
//     `);

//     console.log("✅ Database tables ready!");
//   } catch (error) {
//     console.error("❌ Error creating tables:", error);
//   }
// }

// // user routes middleware file
// const userRoutes = require("./routes/userroutes");

// // user routes middleware
// app.use("/api/user", userRoutes);

// // Question routes middleware file
// const questionRoutes = require("./routes/questionRoute");

// // Question routes middleware
// app.use("/api/question", questionRoutes);

// // answer routes middleware file
// const answerRoutes = require("./routes/answerRoute");

// // answer routes middleware
// app.use("/api/answer", answerRoutes);

// // Health check endpoint
// app.get("/api/health", (req, res) => {
//   res.status(200).json({
//     status: "OK",
//     timestamp: new Date().toISOString(),
//     service: "Evangadi Forum API"
//   });
// });

// // Test email route
// app.post("/api/test-email", async (req, res) => {
//   try {
//     await sendEmail(
//       process.env.EMAIL_USER,
//       "Test Email",
//       "<h1>Email is working!</h1>"
//     );
//     res.json({ message: "Email sent successfully" });
//   } catch (error) {
//     console.error("Test email error:", error);
//     res.status(500).json({ error: error.message });
//   }
// });

// async function start() {
//   try {
//     // Test PostgreSQL connection
//     await dbconnection.query("SELECT NOW()");
//     console.log("✅ Connected to PostgreSQL database!");

//     // Create tables
//     await createTablesIfNotExist();

//     app.listen(PORT);
//     console.log(`✅ Server is running on port ${PORT}`);
//   } catch (error) {
//     console.error("❌ DB connection failed:", error.message);
//   }
// }
// start();

// // const express = require("express");
// // const cors = require("cors");
// // const sendEmail = require("./utils/emailSender");
// // const app = express();
// // PORT = 5000;
// // app.use(express.json());
// // app.use(
// //   cors({
// //     origin: [
// //       "http://localhost:5173",
// //       "http://localhost:5174",
// //       "http://localhost:5175",
// //       "https://2025-evangadi-forum-project.netlify.app",
// //     ],
// //     credentials: true,
// //   })
// // );

// // // database connection
// // const dbconnection = require("./Database/databaseconfig");

// // // user routes middleware file
// // const userRoutes = require("./routes/userroutes");

// // // user routes middleware
// // app.use("/api/user", userRoutes);

// // // Question routes middleware file
// // const questionRoutes = require("./routes/questionRoute");

// // // Question routes middleware
// // app.use("/api/question", questionRoutes);

// // // answer routes middleware file
// // const answerRoutes = require("./routes/answerRoute");

// // // answer routes middleware
// // app.use("/api/answer", answerRoutes);

// // // Test email route
// // app.post("/api/test-email", async (req, res) => {
// //   try {
// //     await sendEmail(
// //       process.env.EMAIL_USER,
// //       "Test Email",
// //       "<h1>Email is working!</h1>"
// //     );
// //     res.json({ message: "Email sent successfully" });
// //   } catch (error) {
// //     console.error("Test email error:", error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // async function start() {
// //   try {
// //     // Test PostgreSQL connection
// //     await dbconnection.query("SELECT NOW()");
// //     console.log("✅ Connected to PostgreSQL database!");

// //     app.listen(PORT);
// //     console.log(`✅ Server is running on port ${PORT}`);
// //   } catch (error) {
// //     console.error("❌ DB connection failed:", error.message);
// //   }
// // }
// // start();

// // // const express = require("express");
// // // const cors = require("cors");
// // // const sendEmail = require("./utils/emailSender");
// // // const app = express();
// // // PORT = 5000;
// // // app.use(express.json());

// // // app.use(
// // //   cors({
// // //     origin: ["http://localhost:5173", "http://localhost:5174"],
// // //     credentials: true,
// // //   })
// // // );

// // // // database connection
// // // const dbconnection = require("./Database/databaseconfig");

// // // // user routes middleware file
// // // const userRoutes = require("./routes/userroutes");

// // // // user routes middleware
// // // app.use("/api/user", userRoutes);

// // // // Question routes middleware file
// // // const questionRoutes = require("./routes/questionRoute");

// // // // Question routes middleware
// // // app.use("/api/question", questionRoutes);

// // // // answer routes middleware file
// // // const answerRoutes = require("./routes/answerRoute");

// // // // answer routes middleware
// // // app.use("/api/answer", answerRoutes);

// // // // Test email route
// // // app.post("/api/test-email", async (req, res) => {
// // //   try {
// // //     await sendEmail(
// // //       process.env.EMAIL_USER,
// // //       "Test Email",
// // //       "<h1>Email is working!</h1>"
// // //     );
// // //     res.json({ message: "Email sent successfully" });
// // //   } catch (error) {
// // //     console.error("Test email error:", error);
// // //     res.status(500).json({ error: error.message });
// // //   }
// // // });

// // // async function start() {
// // //   try {
// // //     await dbconnection;
// // //     console.log("✅ Connected to MySQL2 database!");

// // //     app.listen(PORT);
// // //     console.log(`✅ Server is running on port ${PORT}`);
// // //   } catch (error) {
// // //     console.error("❌ DB connection failed:", error.message);
// // //   }
// // // }
// // // start();
