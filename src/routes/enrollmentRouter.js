const express = require("express");
const enrollmentRouter = express.Router();

const { isLoggedIn, authorize } = require("../middlewares/authMiddleware");
const { submitEnrollment, getMyEnrollments, cancelEnrollment, confirmEnrollment, getAllEnrollments, updateEnrollmentStatus, deleteEnrollment } = require("../controllers/enrollmentController");

enrollmentRouter.get("/", isLoggedIn, authorize("agent", "admin"), getAllEnrollments);
enrollmentRouter.get("/my", isLoggedIn, authorize("student"), getMyEnrollments);

enrollmentRouter.post("/", isLoggedIn, authorize("student"), submitEnrollment);

enrollmentRouter.put("/:id/confirm", isLoggedIn, authorize("agent", "admin"), confirmEnrollment);
enrollmentRouter.put("/:id/cancel", isLoggedIn, authorize("agent", "admin"), cancelEnrollment);

enrollmentRouter.put("/:id/status", isLoggedIn, authorize("agent", "admin"), updateEnrollmentStatus);
enrollmentRouter.delete("/:id", isLoggedIn, authorize("agent", "admin"), deleteEnrollment);


module.exports = enrollmentRouter;