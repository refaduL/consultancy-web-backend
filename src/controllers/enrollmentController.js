
const createError = require("http-errors");
const Enrollment = require("../models/enrollmentModel");

const getAllEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find()
      .populate("user", "first_name last_name email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      message: "Enrollments fetched successfully.",
      payload: { enrollments },
    });
  } catch (error) {
    console.error("getAllEnrollments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments.",
    });
  }
};

const submitEnrollment = async (req, res) => {
  try {
    const {
      courseId,
      courseName,
      batchName,
      currentScore,
      targetScore,
      notes,
    } = req.body;

    console.log("submitEnrollment request body:", req.body);

    // basic validation
    if (!courseId || !courseName || !batchName) {
      return res.status(400).json({
        success: false,
        message: "courseId, courseName, and batchName are required.",
      });
    }

    // prevent duplicate active enrollment
    const existing = await Enrollment.findOne({
      user: req.user._id,
      courseId,
      status: { $ne: "cancelled" },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You already have an active enrollment for ${courseName}.`,
      });
    }

    const enrollment = await Enrollment.create({
      user:         req.user.id,
      courseId,
      courseName,
      batchName,
      currentScore: currentScore || null,
      targetScore:  targetScore  || null,
      notes:        notes        || null,
    });

    return res.status(201).json({
      success: true,
      message: "Enrollment submitted successfully. We'll contact you within 24 hours.",
      payload: { enrollment },
    });
  } catch (error) {
    console.error("submitEnrollment error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

const getMyEnrollments = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      payload: { enrollments },
    });
  } catch (error) {
    console.error("getMyEnrollments error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch enrollments.",
    });
  }
};

const confirmEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found.",
      });
    }

    if (enrollment.status === "confirmed") {
      return res.status(400).json({
        success: false,
        message: "Enrollment is already confirmed.",
      });
    }

    enrollment.status = "confirmed";
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Enrollment confirmed.",
      payload: { enrollment },
    });
  } catch (error) {
    console.error("confirmEnrollment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to confirm enrollment.",
    });
  }
};

const cancelEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findOne({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: "Enrollment not found.",
      });
    }

    if (enrollment.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Enrollment is already cancelled.",
      });
    }

    enrollment.status = "cancelled";
    await enrollment.save();

    return res.status(200).json({
      success: true,
      message: "Enrollment cancelled.",
      payload: { enrollment },
    });
  } catch (error) {
    console.error("cancelEnrollment error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to cancel enrollment.",
    });
  }
};

const updateEnrollmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
 
    if (!["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status. Must be pending | confirmed | cancelled.",
      });
    }
 
    const enrollment = await Enrollment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("user", "first_name last_name email");
 
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }
 
    return res.status(200).json({
      success: true,
      message: `Enrollment ${status}.`,
      payload: { enrollment },
    });
  } catch (error) {
    console.error("adminUpdateStatus error:", error);
    return res.status(500).json({ success: false, message: "Failed to update status." });
  }
};

const deleteEnrollment = async (req, res) => {
  try {
    const enrollment = await Enrollment.findByIdAndDelete(req.params.id);
 
    if (!enrollment) {
      return res.status(404).json({ success: false, message: "Enrollment not found." });
    }
 
    return res.status(200).json({
      success: true,
      message: "Enrollment deleted.",
    });
  } catch (error) {
    console.error("adminDeleteEnrollment error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete enrollment." });
  }
};

module.exports = {
  getAllEnrollments,
  submitEnrollment,
  getMyEnrollments,

  confirmEnrollment,
  cancelEnrollment,

  updateEnrollmentStatus,
  deleteEnrollment,
};