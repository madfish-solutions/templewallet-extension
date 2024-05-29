import { test, expect, page } from 'e2e/src/fixtures/extension';

test.describe('Example 0', () => {
  test('first precondition test', async ({ }) => {
    console.log('first precondition test', );
  });

});

test.afterAll(() => {
  // context.close();
  console.log('after all hook in the file')
});

test.afterEach(() => {
  console.log('after each hook in the file!')
})
