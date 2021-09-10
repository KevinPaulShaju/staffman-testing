const router = require("express").Router();
const user = require("./model");
const Schedule = require("./model2");

router.post("/adduser", async (req, res) => {
  try {
    const { name, email, job } = req.body;
    if (!name || !email || !job) {
      return res.status(402).json({ message: "fill all fields" });
    }
    const newuser = new user({ name, email, job });
    const savedUser = await newuser.save();
    res.status(200).json({ message: "success", user: savedUser });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/addschedule/:userId", async (req, res) => {
  const userId = req.params.userId;
  var { schedule } = req.body;
  if (!schedule) {
    return res.status(402).json({ message: "fill all fields" });
  }

  const startingTime = schedule.from;
  const endingTime = schedule.to;

  const servicefrom = new Date(startingTime);
  const fromoffset = servicefrom.getTimezoneOffset();
  const fromoffsetinmillis = fromoffset * 60 * 1000;
  const fromdateinmillis = servicefrom.getTime();
  const fromlocalinmillis = fromdateinmillis - fromoffsetinmillis;

  const serviceto = new Date(endingTime);
  const tooffset = serviceto.getTimezoneOffset();
  const tooffsetinmillis = tooffset * 60 * 1000;
  const todateinmillis = serviceto.getTime();
  const tolocalinmillis = todateinmillis - tooffsetinmillis;

  const time = new Date();
  const offset = time.getTimezoneOffset();
  const offsetinmillis = offset * 60 * 1000;
  const dateinmillis = time.getTime();
  const localinmillis = dateinmillis - offsetinmillis;
  // const localdate = new Date(localinmillis).toISOString();

  const servicestarts = fromlocalinmillis - localinmillis;
  const serviceends = tolocalinmillis - localinmillis;

  console.log(
    "servicefrom: " + fromlocalinmillis,
    "serviceto: " + tolocalinmillis
  );

  try {
    var existinguser = await user.findOne({ _id: userId });
    if (!existinguser) {
      return res.status(402).json({ message: "user not found" });
    }
    schedule.to = new Date(tolocalinmillis).toISOString();
    schedule.from = new Date(fromlocalinmillis).toISOString();
    schedule.userId = userId;
    const newschedules = new Schedule(schedule);

    setTimeout(async () => {
      const newstatus = {
        schedule: {
          to: new Date(tolocalinmillis).toISOString(),
          from: new Date(fromlocalinmillis).toISOString(),
          location: [51.5074, -0.1278],
        },
        working: true,
      };

      await user.updateOne({ _id: userId }, { $set: { active: newstatus } });
    }, servicestarts);

    const savedschedule = await newschedules.save();
    const scheduleId = savedschedule._id;

    // setTimeout(async () => {
    //   const newstatus = {
    //     schedule: {
    //       to: undefined,
    //       from: undefined,
    //       location: [],
    //     },
    //     working: false,
    //   };

    //   await Schedule.deleteOne({ _id: scheduleId, userId: userId });
    //   await user.updateOne({ _id: userId }, { $set: { active: newstatus } });
    // }, serviceends);

    res.status(200).json({ message: "success" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/get/availableSchedules", async (req, res) => {
  const { from, to, job } = req.body;
  if (!from || !to || !job) {
    return res.status(404).json({ message: "fillup all fields" });
  }

  const servicefrom = new Date(from);
  const fromoffset = servicefrom.getTimezoneOffset();
  const fromoffsetinmillis = fromoffset * 60 * 1000;
  const fromdateinmillis = servicefrom.getTime();
  const fromlocalinmillis = fromdateinmillis - fromoffsetinmillis;
  const fromdateformat = new Date(fromlocalinmillis).toISOString();

  const serviceto = new Date(to);
  const tooffset = serviceto.getTimezoneOffset();
  const tooffsetinmillis = tooffset * 60 * 1000;
  const todateinmillis = serviceto.getTime();
  const tolocalinmillis = todateinmillis - tooffsetinmillis;
  const todateformat = new Date(tolocalinmillis).toISOString();
  console.log(todateformat, fromdateformat);

  try {
    const schedules = await Schedule.find({});
    // console.log(schedules);
    // console.log("....");
    let filteredSchedules;

    const availableSchedules = schedules.filter((schedule) => {
      const to = new Date(schedule.to);
      const from = new Date(schedule.from);
      // console.log(to, from);
      if (
        (to < servicefrom || to > serviceto) &&
        (from < servicefrom || from > serviceto)
      ) {
        return schedule;
      }
    });

    // console.log(availableSchedules)
    // console.log("__________");

    var filtered = availableSchedules.filter(function (el) {
      if (!this[el.userId]) {
        this[el.userId] = true;
        return true;
      }
      return false;
    }, Object.create(null));

    // console.log(filtered);

    const userNames = await Promise.all(
      filtered.map(async (schdule) => {
        const foundUser = await user.findOne({ _id: schdule.userId });
        return foundUser;
      })
    );

    // console.log(userNames);

    const userByJob = userNames.filter((user) => {
      return user.job == req.body.job;
    });

    // console.log(userByJob);

    res.status(200).json({ users: userByJob });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/viewuser", async (req, res) => {
  const userId = req.params.userId;
  try {
    user = await user.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: "no user found" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
