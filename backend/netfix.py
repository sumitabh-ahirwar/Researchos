"""
Drop unusable NAT64-synthesized IPv6 addresses from DNS results.

Some networks (commonly IPv6-mostly mobile hotspots) run DNS64: for a host
that only has an A record, the resolver invents an AAAA record inside the
RFC 6052 well-known prefix 64:ff9b::/96 and expects a NAT64 gateway to
translate the traffic. When that gateway is missing or blocks the port, the
synthesized address is a black hole -- connections to it hang until they
time out instead of being refused.

That is expensive because of how the address list is ordered. Windows'
default prefix policy ranks ::/0 (precedence 40) above IPv4-mapped
::ffff:0:0/96 (precedence 35), so getaddrinfo returns the fake IPv6 address
first, and callers that walk the list in order burn a full connect timeout
on it before reaching the IPv4 address that works.

PyMongo is hit hard by this: pool_shared.py resolves with AF_UNSPEC and has
no option to prefer a family, so every new connection pays the stall once
per replica set member. Three members at ~10s each overruns the default
serverSelectionTimeoutMS and startup fails with ServerSelectionTimeoutError
and no underlying error recorded -- nothing failed, it just never finished.

The guard below is deliberately narrow. It only discards an address when it
sits in the well-known NAT64 prefix *and* the same lookup returned a usable
IPv4 alternative, so a genuinely IPv6-only host reached through NAT64 still
resolves. On a network without DNS64 no synthesized records exist and this
is a no-op, which is why it is safe to leave installed in every environment.
"""

from __future__ import annotations

import ipaddress
import socket
from typing import Any

# RFC 6052. Network-specific prefixes exist too, but they are indistinguishable
# from real addresses without querying the resolver, so we leave them alone.
_NAT64_WELL_KNOWN = ipaddress.IPv6Network("64:ff9b::/96")

_installed = False


def _is_nat64(sockaddr: Any) -> bool:
    try:
        # Strip any scope id ("fe80::1%eth0") before parsing.
        return ipaddress.IPv6Address(str(sockaddr[0]).split("%")[0]) in _NAT64_WELL_KNOWN
    except (ValueError, IndexError, TypeError):
        return False


def install_nat64_resolver_guard() -> bool:
    """
    Wrap socket.getaddrinfo process-wide. Returns True if it was installed.

    asyncio's loop.getaddrinfo delegates to socket.getaddrinfo in an executor,
    so patching the one function covers both the sync and async PyMongo paths,
    plus any HTTP client the agents use.
    """
    global _installed

    if _installed:
        return False

    original = socket.getaddrinfo

    def guarded_getaddrinfo(*args: Any, **kwargs: Any) -> Any:
        results = original(*args, **kwargs)

        if not any(entry[0] == socket.AF_INET for entry in results):
            return results

        kept = [
            entry
            for entry in results
            if not (entry[0] == socket.AF_INET6 and _is_nat64(entry[4]))
        ]

        # Never hand back an empty list; if filtering removed everything the
        # assumption above is wrong and the caller is better off untouched.
        return kept or results

    guarded_getaddrinfo.__wrapped__ = original  # type: ignore[attr-defined]
    socket.getaddrinfo = guarded_getaddrinfo  # type: ignore[assignment]
    _installed = True
    return True
