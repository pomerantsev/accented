import assert from 'node:assert/strict';
import { suite, test } from 'node:test';
import { isSafari26 } from './supports-anchor-positioning';

suite('isSafari26', () => {
  test('matches Safari 26 on iOS', () => {
    assert.equal(
      isSafari26(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.6.1 Mobile/15E148 Safari/604.1',
      ),
      true,
    );
  });

  test('matches Chrome on iOS 26', () => {
    assert.equal(
      isSafari26(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/155.0.8059.37 Mobile/15E148 Safari/604.1',
      ),
      true,
    );
  });

  test('matches desktop Safari 26', () => {
    assert.equal(
      isSafari26(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15',
      ),
      true,
    );
  });

  test('does not match desktop Chrome', () => {
    assert.equal(
      isSafari26(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36',
      ),
      false,
    );
  });

  test('does not match desktop Safari 27', () => {
    assert.equal(
      isSafari26(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0.1 Safari/605.1.15',
      ),
      false,
    );
  });
});
