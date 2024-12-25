const isAuthorize =async (req, res, next) => {

    try {
        if(
            !req.headers.auth ||
            !req.headers.auth.startsWith ('Bearer') ||
            !req.headers.auth.split (' ')[1]
        ){
            return res.status(422).json({
                message: 'Please provide token'
            });
        }
        next();

    } catch (error) {
        console.log(error.message);
        
    }
    
}

module.exports = {
    isAuthorize
}