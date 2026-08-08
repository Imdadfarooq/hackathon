const CourseMaterial = require('../models/CourseMaterial');
const Course = require('../models/Course');
const ApiError = require('../utils/ApiError');

/**
 * GET /api/courses/:id/materials
 * List a course's materials (metadata only — no binary payload). Any auth.
 */
async function listMaterials(req, res) {
  const course = await Course.findById(req.params.id).lean();
  if (!course) throw ApiError.notFound('Course not found');

  const materials = await CourseMaterial.find({ course: course._id })
    .sort({ createdAt: 1 })
    .select('-data') // never ship bytes in a list
    .populate('uploadedBy', 'name role')
    .lean();

  res.json({
    materials: materials.map((m) => ({
      id: m._id,
      title: m.title,
      filename: m.filename,
      mimetype: m.mimetype,
      size: m.size,
      uploadedBy: m.uploadedBy ? { name: m.uploadedBy.name, role: m.uploadedBy.role } : null,
      createdAt: m.createdAt,
    })),
  });
}

/**
 * POST /api/courses/:id/materials  (mentor only, multipart/form-data)
 * Field "file" carries the PDF; optional "title" field names it.
 */
async function uploadMaterial(req, res) {
  const course = await Course.findById(req.params.id);
  if (!course) throw ApiError.notFound('Course not found');
  if (!req.file) throw ApiError.badRequest('A PDF file is required (field "file")');

  const material = await CourseMaterial.create({
    course: course._id,
    title: (req.body.title || req.file.originalname.replace(/\.pdf$/i, '')).slice(0, 160),
    filename: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    data: req.file.buffer,
    uploadedBy: req.user._id,
  });

  res.status(201).json({
    material: {
      id: material._id,
      title: material.title,
      filename: material.filename,
      mimetype: material.mimetype,
      size: material.size,
      createdAt: material.createdAt,
    },
  });
}

/**
 * GET /api/courses/:id/materials/:materialId/file
 * Stream the raw PDF bytes inline so the browser can display it. Any auth.
 */
async function getMaterialFile(req, res) {
  const material = await CourseMaterial.findOne({
    _id: req.params.materialId,
    course: req.params.id,
  }).select('+data');
  if (!material || !material.data) throw ApiError.notFound('Material not found');

  res.setHeader('Content-Type', material.mimetype || 'application/pdf');
  res.setHeader('Content-Length', material.size || material.data.length);
  res.setHeader(
    'Content-Disposition',
    `inline; filename="${material.filename.replace(/"/g, '')}"`
  );
  res.send(material.data);
}

/**
 * DELETE /api/courses/:id/materials/:materialId  (mentor only)
 */
async function deleteMaterial(req, res) {
  const material = await CourseMaterial.findOneAndDelete({
    _id: req.params.materialId,
    course: req.params.id,
  });
  if (!material) throw ApiError.notFound('Material not found');
  res.json({ message: 'Material deleted' });
}

module.exports = { listMaterials, uploadMaterial, getMaterialFile, deleteMaterial };
