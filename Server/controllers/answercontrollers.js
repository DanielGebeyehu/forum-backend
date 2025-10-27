const dbconnection = require("../Database/databaseconfig");
const { supabase } = require("../Database/databaseconfig");

async function get_answers(req, res) {
  const { questionid } = req.params;

  if (!questionid) {
    return res.status(400).json({
      status: "error",
      message: "Invalid or missing questionid.",
    });
  }

  try {
    // Use Supabase native method to fetch answers with username
    const { data, error } = await supabase
      .from('answers')
      .select(`
        answerid,
        userid,
        answer,
        created_at,
        users (username)
      `)
      .eq('questionid', questionid)
      .eq('is_deleted', 0)
      .order('created_at', { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    // Transform the data to flatten the username
    const transformedData = data.map(row => ({
      answerid: row.answerid,
      userid: row.userid,
      answer: row.answer,
      created_at: row.created_at,
      username: row.users?.username || 'Unknown'
    }));

    res.status(200).json({
      status: "success",
      questionid,
      total_answers: transformedData.length,
      data: transformedData,
    });
  } catch (error) {
    console.error("Error fetching answers:", error);
    res.status(500).json({
      status: "error",
      message: "Server error while fetching answers",
      error: error.message,
    });
  }
}

async function post_answers(req, res) {
  try {
    const { answer } = req.body;
    const { questionid } = req.params;
    const userid = req.user.userid;

    if (!userid || !questionid || !answer) {
      return res.status(400).json({
        status: "error",
        message: "userid, questionid, and answer are required",
      });
    }

    // Check if question exists using Supabase
    const { data: questionData, error: questionError } = await supabase
      .from('questions')
      .select('questionid')
      .eq('questionid', questionid)
      .single();

    if (questionError || !questionData) {
      return res.status(404).json({
        status: "error",
        message: "Cannot post answer: question does not exist",
      });
    }

    // Insert answer using Supabase
    const { data: insertData, error: insertError } = await supabase
      .from('answers')
      .insert({
        userid: userid,
        questionid: questionid,
        answer: answer
      })
      .select('answerid, userid, questionid, answer, created_at')
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw insertError;
    }

    res.status(201).json({
      status: "success",
      message: "Answer posted successfully",
      data: insertData,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Server error while creating answer",
      error: error.message,
    });
  }
}

async function update_answer(req, res) {
  const { answerid } = req.params;
  const { answer } = req.body;
  const userid = req.user.userid;

  try {
    const result = await dbconnection.query(
      "SELECT * FROM answers WHERE answerid = $1 AND is_deleted = 0",
      [answerid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Answer not found or already deleted",
      });
    }

    if (result.rows[0].userid !== userid) {
      return res.status(403).json({
        status: "fail",
        message: "You are not allowed to update this answer",
      });
    }

    const newAnswer = answer?.trim() ?? result.rows[0].answer;

    if (newAnswer === result.rows[0].answer) {
      return res.json({
        status: "no_change",
        message: "No changes made to the answer",
      });
    }

    await dbconnection.query(
      "UPDATE answers SET answer = $1 WHERE answerid = $2",
      [newAnswer, answerid]
    );

    return res.json({
      status: "success",
      message: "Answer updated successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "fail", message: "Server error" });
  }
}

async function delete_answer(req, res) {
  const { answerid } = req.params;
  const userid = req.user.userid;

  try {
    const result = await dbconnection.query(
      "SELECT * FROM answers WHERE answerid = $1 AND is_deleted = 0",
      [answerid]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "Answer not found or already deleted",
      });
    }

    if (result.rows[0].userid !== userid) {
      return res.status(403).json({
        status: "fail",
        message: "You are not allowed to delete this answer",
      });
    }

    await dbconnection.query(
      "UPDATE answers SET is_deleted = 1 WHERE answerid = $1",
      [answerid]
    );

    return res.json({
      status: "success",
      message: "Answer deleted successfully",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "fail", message: "Server error" });
  }
}

module.exports = {
  get_answers,
  post_answers,
  update_answer,
  delete_answer,
};

