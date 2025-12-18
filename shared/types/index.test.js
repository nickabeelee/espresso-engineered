import * as fc from 'fast-check';
describe('Shared Types', () => {
    describe('RoastLevel', () => {
        it('should contain valid roast levels', () => {
            const validRoastLevels = [
                'Light',
                'Medium Light',
                'Medium',
                'Medium Dark',
                'Dark'
            ];
            expect(validRoastLevels).toHaveLength(5);
            expect(validRoastLevels).toContain('Light');
            expect(validRoastLevels).toContain('Dark');
        });
    });
    // Example property-based test to verify fast-check setup
    describe('Property-based test example', () => {
        it('should verify fast-check is working', () => {
            fc.assert(fc.property(fc.integer(), (n) => {
                return n + 0 === n;
            }), { numRuns: 100 });
        });
    });
});
//# sourceMappingURL=index.test.js.map