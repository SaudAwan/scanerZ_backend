const generateCode = ()=>{
    const n = 5
    const sixDigitRandomNumber = Math.floor(Math.random() * (9 * Math.pow(10, n))) + Math.pow(10, n)
    return sixDigitRandomNumber

}
module.exports = {generateCode}