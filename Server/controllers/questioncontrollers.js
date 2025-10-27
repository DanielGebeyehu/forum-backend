const dbconnection = require("../Database/databaseconfig");
const { supabase } = require("../Database/databaseconfig");
const { v4: uuidv4 } = require("uuid");

async function get_all_questions(req, res) {
  try {
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        users (username)
      `)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({
        status: "error",
        message: "Database error",
        error: error.message,
      });
    }

    const transformedData = data.map(row => ({
      ...row,
      username: row.users?.username || 'Unknown',
      users: undefined 
    }));

    res.status(200).json({
      status: "success",
      total_questions: transformedData.length,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching questions",
      error: error.message,
    });
  }
}

async function get_single_question(req, res) {
  const { questionid } = req.params;

  if (!questionid) {
    return res.status(400).json({
      status: "error",
      message: "Invalid or missing question_id.",
    });
  }

  try {
    // Use Supabase native method to fetch single question with username
    const { data, error } = await supabase
      .from('questions')
      .select(`
        *,
        users (username)
      `)
      .eq('questionid', questionid)
      .eq('is_deleted', 0)
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(404).json({
        status: "error",
        message: "Question not found",
      });
    }

    // Transform the data to flatten the username
    const transformedData = {
      ...data,
      username: data.users?.username || 'Unknown',
      users: undefined // Remove the nested users object
    };

    res.status(200).json({
      status: "success",
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching question:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error while fetching the question",
      error: error.message,
    });
  }
}

async function post_question(req, res) {
  const { title, tag, description } = req?.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Title is required.",
    });
  }
  if (!description || description.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Description is required.",
    });
  }
  if (!tag || tag.trim() === "") {
    return res.status(400).json({
      status: "error",
      message: "Tag is required.",
    });
  }

  try {
    const questionid = uuidv4();
    await dbconnection.query(
      `INSERT INTO questions (questionid, userid, title, tag, description) VALUES ($1, $2, $3, $4, $5)`,
      [questionid, req.user.userid, title, tag, description]
    );

    res.status(201).json({
      status: "success",
      message: "Question created successfully",
      data: {
        questionid: questionid,
        userid: req.user.userid,
        title,
        tag,
        description,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error while creating question",
      error: error.message,
    });
  }
}

async function update_question(req, res) {
  const { questionid } = req.params;
  const { title, description, tag } = req.body;
  const userid = req.user.userid;

  try {
    const result = await dbconnection.query(
      "SELECT * FROM questions WHERE questionid = $1 AND is_deleted = 0",
      [questionid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Question not found or already deleted",
      });
    }

    if (result.rows[0].userid !== userid) {
      return res.status(403).json({
        status: "fail",
        message: "You are not allowed to update this question",
      });
    }

    const newTitle = title?.trim() ?? result.rows[0].title;
    const newDescription = description?.trim() ?? result.rows[0].description;
    const newTag = tag?.trim() ?? result.rows[0].tag;

    if (
      newTitle === result.rows[0].title &&
      newDescription === result.rows[0].description &&
      newTag === result.rows[0].tag
    ) {
      return res.json({
        status: "no_change",
        message: "No changes made to the question",
      });
    }

    await dbconnection.query(
      "UPDATE questions SET title = $1, description = $2, tag = $3 WHERE questionid = $4",
      [newTitle, newDescription, newTag, questionid]
    );

    return res.json({
      status: "success",
      message: "Question updated successfully!",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: "fail",
      message: "Server error",
    });
  }
}

async function delete_question(req, res) {
  const { questionid } = req.params;
  const userid = req.user.userid;

  try {
    const result = await dbconnection.query(
      "SELECT * FROM questions WHERE questionid = $1 AND is_deleted = 0",
      [questionid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Question not found or already deleted",
      });
    }

    if (result.rows[0].userid !== userid) {
      return res.status(403).json({
        status: "fail",
        message: "You are not allowed to delete this question",
      });
    }

    await dbconnection.query(
      "UPDATE questions SET is_deleted = 1 WHERE questionid = $1",
      [questionid]
    );

    return res.json({
      status: "success",
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "fail", message: "Server error" });
  }
}

module.exports = {
  get_all_questions,
  get_single_question,
  post_question,
  update_question,
  delete_question,
};

