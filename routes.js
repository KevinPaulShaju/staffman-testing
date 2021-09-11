const router = require("express").Router();
const user = require("./model");
const Schedule = require("./model2");
const mongoose = require("mongoose");

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
  const fromdateformat = new Date(fromlocalinmillis);

  const serviceto = new Date(to);
  const tooffset = serviceto.getTimezoneOffset();
  const tooffsetinmillis = tooffset * 60 * 1000;
  const todateinmillis = serviceto.getTime();
  const tolocalinmillis = todateinmillis - tooffsetinmillis;
  const todateformat = new Date(tolocalinmillis);
  console.log("date formats", fromdateformat, todateformat);

  try {
    const schedules = await Schedule.find({});

    var availableSchedules = schedules.filter((schedule) => {
      const to = new Date(schedule.to);
      const from = new Date(schedule.from);


      if (
        (Date.parse(from) < Date.parse(fromdateformat) &&
          Date.parse(to) < Date.parse(fromdateformat)) ||
        (Date.parse(from) > Date.parse(todateformat) &&
          Date.parse(to) > Date.parse(todateformat))
      ) {
        // console.log(true);
        return schedule;
      } else {
        // return console.log(false);
        return false
      }
    });

    var unavailableSchedules = schedules.filter((schedule) => {
      const from = new Date(schedule.from);
      const to = new Date(schedule.to);

      if (
        (Date.parse(from) > Date.parse(fromdateformat) &&
          Date.parse(from) < Date.parse(todateformat)) ||
        (Date.parse(to) > Date.parse(fromdateformat) &&
          Date.parse(to) < Date.parse(todateformat)) ||
        (Date.parse(from) < Date.parse(fromdateformat) &&
          Date.parse(to) > Date.parse(todateformat))
      ) {
        return schedule;
      }
    });

    var availableIds = availableSchedules.map((availschedule) => {
      return availschedule.userId.toString();
    });

    var unavailableIds = unavailableSchedules.map((unavailschedule) => {
      return unavailschedule.userId.toString();
    });


    var filteredIds = availableIds.filter(function (el) {
      if (!this[el]) {
        this[el] = true;
        return true;
      }
      return false;
    }, Object.create(null));

    var availableworkersIds = filteredIds.filter(function (val) {
      return unavailableIds.indexOf(val) == -1;
    });


    const userObjIds = availableworkersIds.map((id) => {
      return mongoose.Types.ObjectId(id);
    });

    const userNames = await Promise.all(
      userObjIds.map(async (id) => {
        const foundUser = await user.findOne({ _id:id});
        return foundUser;
      })
    );

    const userByJob = userNames.filter((user) => {
      return user.job == req.body.job;
    });
  
    const userSchedules = await Promise.all(
      userByJob.map(async (user) => {
        const findSchedules =  await Schedule.find({userId:user.id});
        if(findSchedules.length === 0) {
          return "No Schedule For This User"
        }
        return {userDetails:user,schedule:findSchedules}
      })
    )


    const beforeAfterSchedules = await Promise.all( userSchedules.map(async (schedule) => {
     
      var scheduleBefore = [],scheduleAfter = [];

      const differenceTime = schedule.schedule.map(sc => {
        const from = sc.from.getTime()
        const to = sc.to.getTime()

        if(to<fromdateformat.getTime()){
          const diff = fromdateformat.getTime() - to;
          scheduleBefore.push({userId:sc.userId,scheduleId:sc.id,timeDiff:diff})
        }

        if(from>todateformat.getTime()){
          const diff = from-todateformat.getTime()
          scheduleAfter.push({userId:sc.userId,scheduleId:sc.id,timeDiff:diff})
        }
      
        const timeDiff = {scheduleId:sc.id,userId:sc.userId}
        return timeDiff
      })

  
      var minBef,minAft,before,after
    
      if(scheduleBefore.length>0){
        minBef = scheduleBefore.reduce(function(prev, curr) {
          return prev.timeDiff < curr.timeDiff ? prev : curr;
        });
        before = await Schedule.findOne({_id:minBef.scheduleId,userId:minBef.userId});
      }
      

      if(scheduleAfter.length > 0) {
        minAft = scheduleAfter.reduce(function(prev, curr) {
          return prev.timeDiff < curr.timeDiff ? prev : curr;
        });
        after = await Schedule.findOne({_id:minAft.scheduleId,userId:minAft.userId});
      }
     
      return {user:schedule,Before:before,After:after}
    }))

    res.status(200).json({ avaliableUser: beforeAfterSchedules });
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
