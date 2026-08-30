# Playwright Assertions Guide (Web-First)

Playwright includes auto-retrying assertions. These assertions will automatically re-test the condition until it passes or until the assertion timeout is reached.

---

## 1. Web-First vs Non-Retrying Assertions

```typescript
// ✅ RECOMMENDED: Web-First (Retries automatically for up to expect timeout)
await expect(page.getByRole('button', { name: 'Зберегти' })).toBeEnabled();
await expect(page.getByText('Замовлення створено')).toBeVisible();

// ❌ ANTI-PATTERN: Evaluates immediately once, flaky on asynchronous UI updates
expect(await page.getByRole('button', { name: 'Зберегти' }).isEnabled()).toBe(true);
expect(await page.getByText('Замовлення створено').isVisible()).toBe(true);
```

---

## 2. Common Async Matchers Reference

| Matcher | Description | Example |
| :--- | :--- | :--- |
| `toBeVisible()` | Element is visible in DOM & viewport | `await expect(badge).toBeVisible();` |
| `toBeHidden()` | Element is hidden or detached | `await expect(loader).toBeHidden();` |
| `toBeEnabled()` | Element is not disabled | `await expect(submitBtn).toBeEnabled();` |
| `toBeDisabled()` | Element has disabled attribute/class | `await expect(submitBtn).toBeDisabled();` |
| `toBeChecked()` | Checkbox or radio is checked | `await expect(checkbox).toBeChecked();` |
| `toBeEmpty()` | Input / element is empty | `await expect(nameInput).toBeEmpty();` |
| `toHaveText(expected)` | Element matches text (or regex) | `await expect(header).toHaveText(/Замовлення #\d+/);` |
| `toContainText(expected)` | Element contains substring | `await expect(table).toContainText('HSHL0025');` |
| `toHaveValue(value)` | Input has specified value | `await expect(priceInput).toHaveValue('450.00');` |
| `toHaveValues(values)` | Multi-select has specified values | `await expect(select).toHaveValues(['opt1', 'opt2']);` |
| `toHaveCount(count)` | Number of matching elements | `await expect(rows).toHaveCount(5);` |
| `toHaveAttribute(name, val)` | Element has DOM attribute | `await expect(link).toHaveAttribute('href', '/catalog');` |
| `toHaveClass(className)` | Element has CSS class | `await expect(row).toHaveClass(/selected-row/);` |
| `toHaveURL(urlOrRegex)` | Page URL matches expected | `await expect(page).toHaveURL(/.*#Section\/Products/);` |
| `toHaveTitle(titleOrRegex)`| Page title matches expected | `await expect(page).toHaveTitle(/Creatio/);` |

---

## 3. Soft Assertions

Soft assertions do not terminate test execution immediately upon failure. All failures are compiled and reported at the end of the test.

```typescript
// Soft assertion
await expect.soft(page.getByRole('heading')).toHaveText('Каталог продукції');
await expect.soft(page.getByText('Кількість: 10')).toBeVisible();

// If any soft assertion failed, the test will be marked as failed at the end
```

---

## 4. Custom Error Messages & Timeout Overrides

```typescript
// Custom error message for clear test failure reporting
await expect(
  page.getByRole('button', { name: 'Підтвердити' }),
  'Кнопка "Підтвердити" повинна стати активною після заповнення всіх полів'
).toBeEnabled({ timeout: 15000 });
```

---

## 5. Negated Matchers (`not`)

Every matcher can be inverted using `.not`:

```typescript
await expect(page.locator('.modal-backdrop')).not.toBeVisible();
await expect(submitBtn).not.toBeDisabled();
```
