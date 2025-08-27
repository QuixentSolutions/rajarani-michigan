const express = require("express");
const router = express.Router();
const emailjs = require("@emailjs/nodejs");
const Registration = require("../models/registration");

router.post("/", async (req, res) => {
  try {
    const register = new Registration(req.body);
    const savedRegistration = await register.save();

    // Then send email from frontend using EmailJS
    const templateParams = {
      name: req.body.name.trim(),
      email: req.body.email.trim(),
      eventDate: req.body.eventDate.trim(),
      eventName: req.body.eventName.trim(),
      mobile: req.body.mobile.trim(),
    };

    const serviceId = process.env.EMAILJS_SERVICE_ID;
    const templateId = process.env.EMAILJS_REGISTRATION_TEMPLATE_ID;
    const publicKey = process.env.EMAILJS_PUBLIC_KEY;
    const privateKey = process.env.EMAILJS_PRIVATE_KEY;

    emailjs
      .send(serviceId, templateId, templateParams, {
        publicKey: publicKey,
        privateKey: privateKey,
      })
      .then((response) => {
        console.log("Email sent successfully!", response.status, response.text);
      })
      .catch((err) => {
        console.error("Failed to send email:", err);
      });

    res.status(201).json(savedRegistration);
  } catch (err) {
    console.log(err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await Registration.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
