const Task = require("../models/Task");
const LovedOne = require("../models/LovedOne");
const ActivityLog = require("../models/ActivityLog");
const CarePlan = require("../models/CarePlan");

// نقل الدالة المساعدة خارج الكائن
const formatTimeRemaining = (minutes) => {
  if (minutes < 0) return "متأخر";
  if (minutes < 60) return `${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (hours < 24) {
    return `${hours} ساعة${
      remainingMinutes > 0 ? ` و ${remainingMinutes} دقيقة` : ""
    }`;
  }
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  return `${days} يوم${remainingHours > 0 ? ` و ${remainingHours} ساعة` : ""}`;
};

const taskController = {
  // إنشاء مهمة جديدة
  create: async (req, res) => {
    try {
      const {
        title,
        description,
        loved_one_id,
        assigned_to,
        due_date,
        priority,
        category,
        recurring,
        care_plan,
      } = req.body;
      const assigned_by = req.user.caregiverId;

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: loved_one_id,
        caregivers: assigned_by,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // إذا كان هناك خطة رعاية، تحقق من وجودها
      if (care_plan) {
        const carePlan = await CarePlan.findById(care_plan);
        if (!carePlan) {
          return res.status(404).json({ message: "Care plan not found" });
        }
        // تحقق من أن المهمة تتبع نفس الشخص المحتاج للرعاية في الخطة
        if (carePlan.loved_one.toString() !== loved_one_id) {
          return res.status(400).json({
            message: "Task and care plan must belong to the same loved one",
          });
        }
      }

      // التحقق من أن الشخص المعين له المهمة هو من مقدمي الرعاية
      if (!lovedOne.caregivers.includes(assigned_to)) {
        return res
          .status(403)
          .json({ message: "Invalid caregiver assignment" });
      }

      // التحقق من عدم وجود مهمة مماثلة
      const existingTask = await Task.findOne({
        title,
        loved_one: loved_one_id,
        due_date,
        status: "PENDING",
      });

      if (existingTask) {
        return res.status(400).json({
          message: "Similar task already exists",
          existing_task: existingTask,
        });
      }

      const task = new Task({
        title,
        description,
        loved_one: loved_one_id,
        assigned_to,
        assigned_by,
        due_date,
        priority,
        category,
        recurring,
        care_plan,
      });

      await task.save();

      // إذا كان هناك خطة رعاية، أضف المهمة إليها
      if (care_plan) {
        await CarePlan.findByIdAndUpdate(
          care_plan,
          { $push: { tasks: task._id } },
          { new: true }
        );
      }

      // تسجيل النشاط
      const activityLog = new ActivityLog({
        description: `New task assigned: ${title}`,
        caregiver: assigned_by,
        action_type: "TASK_ASSIGNED",
        metadata: new Map([
          ["task_id", task._id.toString()],
          ["assigned_to", assigned_to],
          ["care_plan", care_plan],
        ]),
      });
      await activityLog.save();

      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب المهام المعينة لمقدم الرعاية
  getAssignedTasks: async (req, res) => {
    try {
      const caregiverId = req.user.caregiverId;
      const { status, priority, category } = req.query;

      const query = { assigned_to: caregiverId };

      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;

      const tasks = await Task.find(query)
        .populate("loved_one", "name")
        .populate("assigned_by", "name")
        .sort({ due_date: 1 })
        .lean();

      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // تحديث حالة المهمة
  updateStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, completion_notes } = req.body;
      const caregiverId = req.user.caregiverId;

      const task = await Task.findById(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      // التحقق من الصلاحيات
      if (task.assigned_to.toString() !== caregiverId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      task.status = status;
      if (completion_notes) task.completion_notes = completion_notes;
      if (status === "COMPLETED") task.completed_at = new Date();

      await task.save();

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  // جلب مهام شخص محتاج للرعاية
  getLovedOneTasks: async (req, res) => {
    try {
      const { id } = req.params;
      const caregiverId = req.user.caregiverId;
      const now = new Date();

      // التحقق من الصلاحيات
      const lovedOne = await LovedOne.findOne({
        _id: id,
        caregivers: caregiverId,
      });

      if (!lovedOne) {
        return res.status(403).json({ message: "Not authorized" });
      }

      // جلب المهام مع فلترة محسنة
      const tasks = await Task.find({
        loved_one: id,
        $or: [
          {
            status: "PENDING",
            due_date: { $gte: now },
          },
          {
            status: "COMPLETED",
            completed_at: {
              $gte: new Date(now - 24 * 60 * 60 * 1000),
            },
          },
        ],
      })
        .populate("assigned_to", "name")
        .populate("assigned_by", "name")
        .sort({ due_date: 1, priority: -1 })
        .lean();

      // إزالة المهام المكررة
      const uniqueTasks = tasks.reduce((acc, task) => {
        const key = `${task.title}-${task.due_date}`;
        if (
          !acc[key] ||
          new Date(task.createdAt) > new Date(acc[key].createdAt)
        ) {
          acc[key] = task;
        }
        return acc;
      }, {});

      const filteredTasks = Object.values(uniqueTasks);

      // تنظيم المهام
      const organizedTasks = {
        pending: filteredTasks
          .filter((t) => t.status === "PENDING")
          .map((task) => {
            const minutesUntilDue = task.due_date
              ? Math.floor((new Date(task.due_date) - now) / (1000 * 60))
              : null;

            return {
              ...task,
              time_until_due: minutesUntilDue,
              time_until_due_formatted: formatTimeRemaining(minutesUntilDue),
              urgency:
                minutesUntilDue <= 60
                  ? "URGENT"
                  : minutesUntilDue <= 180
                  ? "SOON"
                  : "NORMAL",
            };
          }),
        completed: filteredTasks
          .filter((t) => t.status === "COMPLETED")
          .map((task) => ({
            ...task,
            completed_duration: task.completed_at
              ? formatTimeRemaining(
                  Math.floor((now - new Date(task.completed_at)) / (1000 * 60))
                )
              : null,
          })),
        total: filteredTasks.length,
        statistics: {
          high_priority: filteredTasks.filter((t) => t.priority === "HIGH")
            .length,
          upcoming_24h: filteredTasks.filter(
            (t) =>
              t.status === "PENDING" &&
              new Date(t.due_date) - now <= 24 * 60 * 60 * 1000
          ).length,
          by_category: filteredTasks.reduce((acc, task) => {
            acc[task.category] = (acc[task.category] || 0) + 1;
            return acc;
          }, {}),
          completion_rate: filteredTasks.length
            ? Math.round(
                (filteredTasks.filter((t) => t.status === "COMPLETED").length /
                  filteredTasks.length) *
                  100
              )
            : 0,
        },
      };

      res.json(organizedTasks);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
};

module.exports = taskController;
