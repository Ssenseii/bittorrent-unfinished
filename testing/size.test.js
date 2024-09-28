const size = require('../src/function-testing');


// Mock data for testing
const torrentWithFiles = {
    info: {
        files: [
            { length: 100 },
            { length: 200 },
            { length: 300 },
        ],
    },
};

const torrentWithoutFiles = {
    info: {
        length: 500,
    },
};

// Test cases
test('calculates size for torrent with files', () => {
    // Arrange
    const result = size(torrentWithFiles);

    // Assert
    expect(result).toBeInstanceOf(ArrayBuffer);
    
    
});

test('calculates size for torrent without files', () => {
    // Arrange
    const result = size(torrentWithoutFiles);

    // Assert
    expect(result).toBeInstanceOf(ArrayBuffer);
    // You can add more specific assertions based on the expected ArrayBuffer content.
});
