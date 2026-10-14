export const validate = (schema) => (req, res, next) => {
  try {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!parsed.success) {
      const formattedErrors = parsed.error.issues.map((err) => ({
        field: err.path.slice(1).join('.'),
        message: err.message,
      }));

      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The submitted form or request contains invalid fields.',
          details: formattedErrors,
        },
      });
    }

    req.validated = parsed.data;
    next();
  } catch (error) {
    next(error);
  }
};
