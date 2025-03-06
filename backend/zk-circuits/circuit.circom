pragma circom 2.0.0;

template PasswordCheck() {
    signal input passwordHash[16]; 
    signal input providedPassword[16];
    signal output isValid;
    
    // Track matches for each character
    signal matches[16];
    signal matchCount;
    
    // Check each character and count matches
    var sum = 0;
    for (var i = 0; i < 16; i++) {
        // Compute match for current position using <--
        matches[i] <-- passwordHash[i] == providedPassword[i] ? 1 : 0;
        
        // Ensure matches[i] is binary (0 or 1)
        matches[i] * (matches[i] - 1) === 0;
        
        // Constrain match value based on inputs
        matches[i] * (passwordHash[i] - providedPassword[i]) === 0;
        
        sum += matches[i];
    }
    
    // Assign sum to matchCount
    matchCount <-- sum;
    
    // Set isValid based on matchCount
    isValid <-- matchCount == 16 ? 1 : 0;
    
    // Ensure isValid is binary
    isValid * (isValid - 1) === 0;
    
    // Constrain relationship between matchCount and isValid
    (16 - matchCount) * isValid === 0;
}

component main = PasswordCheck();