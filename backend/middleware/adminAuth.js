module.exports = (req, res, next) => {
    // req.auth est rempli par ton middleware auth précédent
    if (req.auth && req.auth.role === 'admin') {
        next(); // C'est un admin, on continue
    } else {
        res.status(403).json({ error: "Accès refusé. Droits administrateur requis." });
    }
};