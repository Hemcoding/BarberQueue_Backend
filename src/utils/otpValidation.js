const otpValidation = (otpTime) => {
        try {
           const cDateTime = new Date();
           const duration = (otpTime - cDateTime.getTime())/60000
           const minutes = Math.abs(duration)

           console.log(minutes);

           if(minutes > 5){
                return false
           }
           return true
        } catch (error) {
            console.log(error);    
        }
}

export {otpValidation}