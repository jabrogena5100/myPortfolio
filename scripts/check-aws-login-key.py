#!/usr/bin/env python3
"""Diagnose `aws login` sessions whose key the AWS CLI cannot load.

Symptom:  aws: [ERROR]: 7178 (AWS_ERROR_CAL_UNSUPPORTED_KEY_FORMAT): Key format is not supported.
Cause found 2026-11-18: the session's P-256 private key was written with a 31-byte private value instead of
the required 32 (a leading zero byte was dropped, which happens for about 1 in 256 random keys).
Fix: run `aws login --remote --profile <profile>` again to generate a new key.

This script reads only the DER structure (tags and lengths) of the key in ~/.aws/login/cache/*.json and
prints OK or BAD per cache file. It never prints key material. Read-only; it makes no AWS call.
"""
import base64, datetime, glob, json, os, re, sys

def private_value_length(der: bytes) -> int:
    """Length of the OCTET STRING that holds the private value in an RFC 5915 ECPrivateKey."""
    def tlv(b, i):
        tag, l, hdr = b[i], b[i + 1], 2
        if l & 0x80:
            n = l & 0x7F
            l, hdr = int.from_bytes(b[i + 2:i + 2 + n], "big"), 2 + n
        return tag, l, hdr
    tag, l, hdr = tlv(der, 0)
    assert tag == 0x30, "not a SEQUENCE"
    i = hdr
    tag, l, h = tlv(der, i)            # version INTEGER
    i += h + l
    tag, l, h = tlv(der, i)            # privateKey OCTET STRING
    assert tag == 0x04, "no private value"
    return l

bad = 0
files = sorted(glob.glob(os.path.expanduser("~/.aws/login/cache/*.json")), key=os.path.getmtime)
if not files:
    print("No aws login cache files found.")
for f in files:
    stamp = datetime.datetime.fromtimestamp(os.path.getmtime(f)).strftime("%Y-%m-%d %H:%M")
    try:
        pem = json.load(open(f))["dpopKey"]
        der = base64.b64decode(re.sub(r"-----[A-Z ]+-----|\s", "", pem))
        n = private_value_length(der)
    except Exception as e:  # noqa: BLE001
        print(f"{os.path.basename(f)[:8]}  {stamp}  UNREADABLE ({type(e).__name__})"); bad = 1; continue
    ok = n == 32
    bad |= not ok
    print(f"{os.path.basename(f)[:8]}  {stamp}  private value {n} bytes  {'OK' if ok else 'BAD (needs 32): log in again for this profile'}")
sys.exit(1 if bad else 0)
