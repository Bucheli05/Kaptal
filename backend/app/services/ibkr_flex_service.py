"""Servicio de integración con IBKR Flex Web Service."""

import logging
import time
import xml.etree.ElementTree as ET
from decimal import Decimal
from typing import Any

import httpx

logger = logging.getLogger(__name__)

FLEX_BASE_URL = (
    "https://ndcdyn.interactivebrokers.com" "/AccountManagement/FlexWebService"
)


class IbkrFlexService:
    """Cliente para IBKR Flex Web Service."""

    def __init__(self, flex_token: str, flex_query_id: str):
        self.flex_token = flex_token
        self.flex_query_id = flex_query_id
        self.client = httpx.Client(timeout=60.0)

    def _send_request(self) -> dict[str, Any]:
        """Envía SendRequest y retorna referenceCode o error."""
        url = (
            f"{FLEX_BASE_URL}/SendRequest"
            f"?t={self.flex_token}"
            f"&q={self.flex_query_id}"
            f"&v=3"
        )
        resp = self.client.get(url)
        resp.raise_for_status()
        root = ET.fromstring(resp.text)

        status = root.find("Status")
        if status is not None and status.text != "Success":
            error = root.find("ErrorMessage")
            msg = error.text if error is not None else "Flex SendRequest failed"
            raise RuntimeError(msg)

        ref = root.find("ReferenceCode")
        if ref is None or not ref.text:
            raise RuntimeError("No ReferenceCode in Flex response")

        return {"reference_code": ref.text}

    def _get_statement(self, reference_code: str) -> str:
        """Obtiene el reporte XML con el referenceCode."""
        url = (
            f"{FLEX_BASE_URL}/GetStatement"
            f"?t={self.flex_token}"
            f"&q={reference_code}"
            f"&v=3"
        )
        resp = self.client.get(url)
        resp.raise_for_status()
        return resp.text

    def fetch_report(self) -> dict[str, Any]:
        """Obtiene el reporte completo: posiciones + resumen."""
        ref = self._send_request()
        # IBKR puede tardar ~20s en generar el reporte
        time.sleep(2)
        xml_text = self._get_statement(ref["reference_code"])
        logger.info("Flex XML length: %d chars", len(xml_text))
        return self._parse_xml(xml_text)

    def _parse_xml(self, xml_text: str) -> dict[str, Any]:
        """Parsea XML de Flex Query a dict con posiciones y resumen."""
        root = ET.fromstring(xml_text)

        # Log a snippet of the XML to see actual structure
        logger.info("Flex XML snippet: %s", xml_text[:600])

        # Extraer metadatos de FlexStatement
        flex_statement = root.find(".//FlexStatement")
        statement_period = None
        from_date = None
        to_date = None
        if flex_statement is not None:
            statement_period = self._get_attr(flex_statement, "period")
            from_date = self._get_attr(flex_statement, "fromDate")
            to_date = self._get_attr(flex_statement, "toDate")
            logger.info(
                "FlexStatement period=%s fromDate=%s toDate=%s",
                statement_period, from_date, to_date,
            )

        positions = []
        for pos in root.findall(".//OpenPosition"):
            # IBKR Flex XML uses ATTRIBUTES, not child elements
            positions.append(
                {
                    "symbol": self._get_attr(pos, "symbol"),
                    "description": self._get_attr(pos, "description"),
                    "asset_class": self._get_attr(pos, "assetCategory"),
                    "sector": self._get_attr(pos, "sector"),
                    "currency": self._get_attr(pos, "currency"),
                    "quantity": self._attr_to_decimal(pos, "position"),
                    "avg_cost": self._attr_to_decimal(pos, "costBasisPrice"),
                    "market_price": self._attr_to_decimal(pos, "markPrice"),
                    "market_value": self._attr_to_decimal(pos, "positionValue"),
                    "unrealized_pnl": self._attr_to_decimal(pos, "fifoPnlUnrealized"),
                    "realized_pnl": self._attr_to_decimal(pos, "fifoPnlRealized"),
                    "cost_basis_price": self._attr_to_decimal(pos, "costBasisPrice"),
                    "fifo_pnl_unrealized": self._attr_to_decimal(
                        pos, "fifoPnlUnrealized"
                    ),
                }
            )

        logger.info("Parsed %d positions from Flex XML", len(positions))
        if positions:
            logger.info("First position sample: %s", positions[0])

        # Net liquidation: prefer AccountInformation, fallback sum of positions
        net_liquidation = Decimal("0")
        cash = Decimal("0")
        daily_pnl = Decimal("0")

        acc_info = root.find(".//AccountInformation")
        if acc_info is not None:
            nl = self._attr_to_decimal(acc_info, "netLiquidation")
            net_liquidation = nl or net_liquidation
            c = self._attr_to_decimal(acc_info, "cash")
            cash = c or cash
        else:
            # Fallback: sum all position values
            for pos in positions:
                mv = pos.get("market_value")
                if mv:
                    net_liquidation += mv

        # Also try CashReport for cash balance
        for el in root.findall(".//CashReport"):
            if cash == 0:
                cash = self._attr_to_decimal(el, "endingCash") or cash

        return {
            "positions": positions,
            "statement_period": statement_period,
            "from_date": from_date,
            "to_date": to_date,
            "summary": {
                "net_liquidation": net_liquidation,
                "cash": cash,
                "daily_pnl": daily_pnl,
            },
        }

    @staticmethod
    def _get_attr(element: ET.Element, attr: str) -> str | None:
        return element.get(attr)

    @staticmethod
    def _attr_to_decimal(element: ET.Element, attr: str) -> Decimal | None:
        val = element.get(attr)
        if val is None:
            return None
        try:
            return Decimal(val)
        except Exception:
            return None
