const { createClient } = require("@supabase/supabase-js");

require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variables");
}

const supabase = createClient(supabaseUrl, supabaseKey);


const query = async (text, params = []) => {
  const cleanText = text.trim();


  if (cleanText.match(/SELECT NOW\(\)/i)) {
    return { rows: [{ now: new Date() }] };
  }

  
  if (cleanText.match(/CREATE TABLE IF NOT EXISTS/i)) {
    console.log(
      "⚠️ Table creation skipped - create tables in Supabase dashboard"
    );
    return { rows: [] };
  }

  const selectWithJoinMatch = cleanText.match(
    /SELECT (.+?) FROM (\w+)\s+INNER JOIN (\w+) ON (.+?)(?: WHERE (.+?))?(?: ORDER BY (.+?))?$/i
  );
  if (selectWithJoinMatch) {
    const [, columns, mainTable, joinTable, joinCondition, whereClause, orderBy] = selectWithJoinMatch;
    
    const columnList = columns.split(',').map(col => col.trim());
    const selectColumns = columnList.map(col => {
      if (col.includes('.')) {
        return col;
      }
      return col;
    }).join(', ');
    
    let queryBuilder = supabase
      .from(mainTable)
      .select(`${selectColumns}, ${joinTable}(*)`);

    if (whereClause) {
      if (whereClause.includes('is_deleted = 0')) {
        queryBuilder = queryBuilder.eq('is_deleted', false);
      }
    }

    if (orderBy) {
      const orderParts = orderBy.split(' ');
      const orderColumn = orderParts[0].split('.')[1] || orderParts[0];
      const orderDirection = orderParts[1]?.toLowerCase() === 'desc' ? false : true;
      queryBuilder = queryBuilder.order(orderColumn, { ascending: orderDirection });
    }

    const { data, error } = await queryBuilder;
    if (error) {
      console.error("Select with join error:", error);
      throw error;
    }
    
    const transformedData = data?.map(row => {
      const transformed = { ...row };
      if (row[joinTable]) {
        Object.keys(row[joinTable]).forEach(key => {
          transformed[key] = row[joinTable][key];
        });
        delete transformed[joinTable];
      }
      return transformed;
    }) || [];
    
    return { rows: transformedData };
  }

  const selectMatch = cleanText.match(
    /SELECT (.+?) FROM (\w+)(?: WHERE (\w+) = \$1)?/i
  );
  if (selectMatch) {
    const [, columns, table, whereColumn] = selectMatch;
    
    const cleanColumns = columns.trim();
    
    let queryBuilder = supabase
      .from(table)
      .select(cleanColumns === "*" ? "*" : cleanColumns);

    if (whereColumn && params[0] !== undefined) {
      queryBuilder = queryBuilder.eq(whereColumn, params[0]);
    }

    const { data, error } = await queryBuilder;
    if (error) {
      console.error("Select error:", error);
      throw error;
    }
    return { rows: data || [] };
  }

  const insertMatch = cleanText.match(
    /INSERT INTO (\w+)\s*\((.*?)\)\s*VALUES\s*\((\$\d+(?:,\s*\$\d+)*)\)/i
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

    if (error) {
      console.error("Insert error:", error);
      throw error;
    }
    return { rows: data || [] };
  }
  const updateMatch = cleanText.match(
    /UPDATE (\w+) SET (.+?) WHERE (\w+) = \$(\d+)/i
  );
  if (updateMatch) {
    const [, table, setClause, whereColumn, whereParamNum] = updateMatch;
    const updates = {};

    const setParts = setClause.split(",");

    for (let part of setParts) {
      const [colName, value] = part.split("=").map((s) => s.trim());

      if (value.includes("$")) {
        const paramNum = parseInt(value.match(/\$(\d+)/)[1]);
        updates[colName] = params[paramNum - 1];
      } else if (value === "NULL") {
        updates[colName] = null;
      } else if (value.includes("NOW()")) {
        if (value.includes("INTERVAL")) {
          const minutes = value.match(/INTERVAL '(\d+) minutes?'/i);
          if (minutes) {
            const futureDate = new Date();
            futureDate.setMinutes(
              futureDate.getMinutes() + parseInt(minutes[1])
            );
            updates[colName] = futureDate.toISOString();
          }
        } else {
          updates[colName] = new Date().toISOString();
        }
      }
    }

    const { data, error } = await supabase
      .from(table)
      .update(updates)
      .eq(whereColumn, params[parseInt(whereParamNum) - 1])
      .select();

    if (error) {
      console.error("Update error:", error);
      throw error;
    }
    return { rows: data || [] };
  }

  const deleteMatch = cleanText.match(/DELETE FROM (\w+) WHERE (\w+) = \$1/i);
  if (deleteMatch) {
    const [, table, column] = deleteMatch;
    const { error } = await supabase.from(table).delete().eq(column, params[0]);

    if (error) throw error;
    return { rows: [] };
  }

  console.error(" Unsupported query:", cleanText);
  throw new Error(
    `Query pattern not supported. Please use Supabase native methods.`
  );
};

module.exports = {
  query,
  supabase,
};

