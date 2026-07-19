const express = require('express');
const Content = require('../models/Content');
const { verifyAdmin } = require('../middleware/verifyAdmin');

const router = express.Router();

// GET /api/content — public, every visitor's browser calls this on page load.
router.get('/content', async (req, res) => {
  try {
    let content = await Content.findOne();
    if (!content) {
      // First run: nothing saved yet, so the frontend just keeps its
      // built-in defaults. Returning an empty object is enough.
      return res.json({});
    }
    res.json(content);
  } catch (err) {
    console.error('[GET /api/content]', err);
    res.status(500).json({ error: 'Could not load site content.' });
  }
});

// POST /api/admin/content — admin only, saves tagline/plans/addons/etc.
router.post('/admin/content', verifyAdmin, async (req, res) => {
  try {
    const { tagline, plans, addons, socialLinks, galleryImage } = req.body;

    const update = {};
    if (typeof tagline === 'string') update.tagline = tagline;
    if (Array.isArray(plans)) update.plans = plans;
    if (Array.isArray(addons)) update.addons = addons;
    if (socialLinks && typeof socialLinks === 'object') update.socialLinks = socialLinks;
    // Only overwrite the photo if a new one was actually sent this session.
    if (typeof galleryImage === 'string' && galleryImage.length > 0) {
      update.galleryImage = galleryImage;
    }

    const content = await Content.findOneAndUpdate({}, update, {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true
    });

    res.json({ ok: true, content });
  } catch (err) {
    console.error('[POST /api/admin/content]', err);
    res.status(500).json({ error: 'Could not save site content.' });
  }
});

module.exports = router;
