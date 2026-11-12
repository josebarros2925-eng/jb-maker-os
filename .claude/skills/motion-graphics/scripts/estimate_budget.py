#!/usr/bin/env python3
"""Sum user-supplied quotes. No network, billing, balance or authorization checks."""
import argparse
import json
import sys
from datetime import date
from decimal import Decimal, InvalidOperation, localcontext
from pathlib import Path


def amount(value, field, positive=False):
    if isinstance(value, bool) or not isinstance(value, (str, int, float)):
        raise ValueError(f"{field}: expected a decimal number")
    try:
        number = Decimal(str(value))
    except InvalidOperation as exc:
        raise ValueError(f"{field}: invalid decimal") from exc
    if not number.is_finite() or number < 0 or (positive and number == 0):
        raise ValueError(f"{field}: expected a finite {'positive' if positive else 'nonnegative'} number")
    if number > Decimal('1e12') or number.as_tuple().exponent < -12:
        raise ValueError(f"{field}: out of supported numeric range (up to 1e12 and 12 decimal places)")
    return number


def text_field(item, field):
    value = item.get(field)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}: required nonempty string")
    return value.strip()


def calculate(document):
    if not isinstance(document, dict) or not isinstance(document.get('items'), list) or not document['items']:
        raise ValueError('items: expected a nonempty list')
    rows, totals = [], {}
    for index, item in enumerate(document['items'], 1):
        if not isinstance(item, dict):
            raise ValueError(f'item {index}: expected an object')
        try:
            row = {key: text_field(item, key) for key in (
                'label', 'provider', 'model', 'settings', 'unit', 'quote_source', 'quoted_at')}
            date.fromisoformat(row['quoted_at'])
            cost = amount(item.get('unit_cost'), 'unit_cost')
            quantity = amount(item.get('quantity'), 'quantity', positive=True)
            attempts = item.get('attempts')
            if isinstance(attempts, bool) or not isinstance(attempts, int) or not 1 <= attempts <= 100:
                raise ValueError('attempts: expected an integer from 1 to 100, including the first attempt')
            with localcontext() as context:
                context.prec = 80
                total = cost * quantity * attempts
            row.update(unit_cost=format(cost, 'f'), quantity=format(quantity, 'f'),
                       attempts=attempts, estimated_total=format(total, 'f'))
            rows.append(row)
            key = (row['provider'], row['unit'])
            with localcontext() as context:
                context.prec = 80
                totals[key] = totals.get(key, Decimal(0)) + total
        except (ValueError, TypeError) as exc:
            raise ValueError(f'item {index}: {exc}') from exc
    return {
        'status': 'estimate_only',
        'authorization': 'not_granted_by_this_calculation',
        'quote_validity': 'not_verified',
        'items': rows,
        'totals': [dict(provider=provider, unit=unit, estimated_total=format(total, 'f'))
                   for (provider, unit), total in sorted(totals.items())],
        'notes': ['No live prices, balances or actual charges were queried.',
                  'Totals cover all planned attempts; different providers/units are not combined.']
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('quote', type=Path, help='JSON containing an items list')
    args = parser.parse_args()
    try:
        result = calculate(json.loads(args.quote.read_text(encoding='utf-8')))
    except (OSError, ValueError, TypeError) as exc:
        print(json.dumps({'error': str(exc)}, ensure_ascii=False), file=sys.stderr)
        return 2
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
