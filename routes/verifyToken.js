const { verifyToken } = require('../config/jwt');

// Example protected route
router.get('/protected', verifyToken, (req, res) => {
    res.json({ message: "You have accessed a protected route" });
});
