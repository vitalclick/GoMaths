<?php

declare(strict_types=1);

/**
 * Contact form handler for the static GoMaths site on cPanel.
 *
 * The landing page is prerendered to static HTML, so the TanStack server
 * function it originally posted to does not exist at runtime. This takes
 * its place: plain PHP, which cPanel runs without any extra setup.
 *
 * It lives in public/ so the build copies it to the site root untouched —
 * Vite does not process files in public/, so the PHP is emitted verbatim.
 *
 * Security notes, since this is the one publicly writable entry point:
 *  - Every field is length-checked and the email is validated before use.
 *  - CR/LF is rejected in anything that reaches a mail header. Without
 *    that check a submitted "name" containing a newline could append
 *    arbitrary headers (Bcc:, Content-Type:) and turn this into an open
 *    relay. This is the single most important line in the file.
 *  - `From` is a fixed address on our own domain. Using the visitor's
 *    address there fails SPF/DMARC and gets the mail dropped; their
 *    address goes in `Reply-To`, which is what you actually want when
 *    hitting reply.
 *  - A hidden honeypot field catches the naive bots.
 *  - A short per-IP cooldown blunts flooding. It is best-effort, not a
 *    real rate limiter — sufficient for a contact form.
 */

const MAIL_TO = 'support@gomaths.co.za';
const MAIL_FROM = 'no-reply@gomaths.co.za';
const COOLDOWN_SECONDS = 20;

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');
header('Cache-Control: no-store');

function fail(int $status, string $message): never
{
    http_response_code($status);
    echo json_encode(['ok' => false, 'message' => $message], JSON_UNESCAPED_SLASHES);
    exit;
}

function succeed(): never
{
    echo json_encode(['ok' => true], JSON_UNESCAPED_SLASHES);
    exit;
}

/** Anything reaching a mail header must not be able to start a new one. */
function hasHeaderInjection(string $value): bool
{
    return preg_match('/[\r\n]/', $value) === 1;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    fail(405, 'Method not allowed.');
}

$raw = file_get_contents('php://input');
if ($raw === false || $raw === '' || strlen($raw) > 20000) {
    fail(400, 'We could not read your message.');
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    fail(400, 'We could not read your message.');
}

// Honeypot: a real person never fills this in — it is visually hidden.
// Answer 200 so bots cannot tell they were caught.
if (trim((string) ($data['company'] ?? '')) !== '') {
    succeed();
}

$name = trim((string) ($data['name'] ?? ''));
$email = trim((string) ($data['email'] ?? ''));
$subject = trim((string) ($data['subject'] ?? ''));
$message = trim((string) ($data['message'] ?? ''));

if ($name === '' || mb_strlen($name) > 100) {
    fail(422, 'Please enter your name.');
}
if ($email === '' || mb_strlen($email) > 255 || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fail(422, 'Please enter a valid email address.');
}
if (mb_strlen($subject) > 150) {
    fail(422, 'That subject is too long.');
}
if (mb_strlen($message) < 10 || mb_strlen($message) > 2000) {
    fail(422, 'Please write between 10 and 2000 characters.');
}
if (hasHeaderInjection($name) || hasHeaderInjection($email) || hasHeaderInjection($subject)) {
    fail(422, 'Please remove line breaks from your name, email and subject.');
}

// Best-effort per-IP cooldown. Keyed by a hash so we are not writing raw
// IP addresses to disk for a form that does not otherwise store anything.
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$stamp = sys_get_temp_dir() . '/gomaths-contact-' . hash('sha256', $ip);
$last = @filemtime($stamp);
if ($last !== false && (time() - $last) < COOLDOWN_SECONDS) {
    fail(429, 'You just sent a message — please wait a moment before sending another.');
}
@touch($stamp);

$mailSubject = $subject !== ''
    ? sprintf('[GoMaths contact] %s', $subject)
    : '[GoMaths contact] New message';

$body = implode("\n", [
    'New message from the GoMaths website.',
    '',
    'Name:    ' . $name,
    'Email:   ' . $email,
    'Subject: ' . ($subject !== '' ? $subject : '(none)'),
    'Sent:    ' . gmdate('Y-m-d H:i:s') . ' UTC',
    '',
    '---',
    '',
    $message,
    '',
]);

$headers = implode("\r\n", [
    'From: GoMaths Website <' . MAIL_FROM . '>',
    'Reply-To: ' . $name . ' <' . $email . '>',
    'Content-Type: text/plain; charset=UTF-8',
    'MIME-Version: 1.0',
    'X-Mailer: gomaths-contact',
]);

// -f sets the envelope sender so bounces come back to us rather than the
// web server's default account.
$sent = @mail(MAIL_TO, $mailSubject, $body, $headers, '-f' . MAIL_FROM);

if (!$sent) {
    error_log('[gomaths-contact] mail() failed for ' . $email);
    fail(500, "We couldn't send your message. Please email support@gomaths.co.za directly.");
}

succeed();
