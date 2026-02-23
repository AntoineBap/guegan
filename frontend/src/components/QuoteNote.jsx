import React from "react";
import {
  Page,
  Text,
  View,
  Document,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";
import { logoBase64 } from "../assets/logoData";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  infoContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  sellerBlock: { width: "45%" },
  clientBlock: { width: "45%", textAlign: "right" },
  companyTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 5,
    marginTop: 5,
  },
  bold: { fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  docTitle: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 5 },
  validityText: { fontSize: 10, color: "#e74c3c", marginBottom: 20 },
  introText: { marginBottom: 20 },
  table: {
    display: "table",
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    borderRightWidth: 0,
    borderBottomWidth: 0,
    marginBottom: 20,
  },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColHeader: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    backgroundColor: "#f0f0f0",
  },
  tableCol: {
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
  },
  tableCellHeader: {
    margin: 5,
    fontSize: 10,
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  tableCell: { margin: 5, fontSize: 10 },
  
  colNum: { width: "5%" },
  colDesc: { width: "50%" },
  colQty: { width: "15%", textAlign: "center" },
  colPU: { width: "15%", textAlign: "right" },
  colTotal: { width: "15%", textAlign: "right" },

  totalsContainer: {
    width: "40%",
    marginLeft: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderColor: "#000",
    padding: 10,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  conditionsBox: {
    marginTop: 40,
    padding: 10,
    backgroundColor: "#f9f9f9",
    border: "1px solid #ddd",
    fontSize: 10,
  },
});

const QuoteNote = ({ quote }) => {
  const dateOptions = { year: "numeric", month: "long", day: "numeric" };
  const creationDate = new Date(quote.createdAt);
  const todayStr = creationDate.toLocaleDateString("fr-FR", dateOptions);
  
  const validUntilDate = new Date(creationDate);
  validUntilDate.setMonth(validUntilDate.getMonth() + 1);
  const validUntilStr = validUntilDate.toLocaleDateString("fr-FR", dateOptions);

  const user = quote.userId || {};

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Image src={logoBase64} style={{ width: 75 }} />
            <Text style={styles.companyTitle}>Etablissements GUEGAN</Text>
          </View>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.sellerBlock}>
            <Text style={styles.bold}>Émetteur :</Text>
            <Text>Etablissements GUEGAN</Text>
            <Text>1 Rue de l'Industrie</Text>
            <Text>93000 Bobigny</Text>
            <Text>Tél : 01 48 40 05 05</Text>
            <Text>Email : contact@etsguegan.com</Text>
          </View>

          <View style={styles.clientBlock}>
            <Text style={styles.bold}>Client (Facturation) :</Text>
            <Text>{user.companyName || "Particulier"}</Text>
            <Text>{user.firstName} {user.lastName}</Text>
            <Text>{user.companyAddress || user.address || ""}</Text>
            <Text>{user.zip || ""} {user.city || ""}</Text>
            <Text>Email : {user.email}</Text>
            <Text>Tél : {user.phone || "N/A"}</Text>
            {user.siret ? <Text>SIRET : {user.siret}</Text> : null}
            {user.tvaNumber ? <Text>TVA : {user.tvaNumber}</Text> : null}
          </View>
        </View>

        <Text style={styles.docTitle}>Devis N° {quote.quoteNumber}</Text>
        <Text style={{ marginBottom: 5 }}>Date d'émission : {todayStr}</Text>
        <Text style={styles.validityText}>Devis valable 1 mois, jusqu'au {validUntilStr}.</Text>

        <Text style={styles.introText}>
          Madame, Monsieur,{"\n"}
          Suite à votre demande, nous vous prions de bien vouloir trouver ci-dessous notre proposition commerciale :
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={[styles.tableColHeader, styles.colNum]}>
              <Text style={styles.tableCellHeader}>N°</Text>
            </View>
            <View style={[styles.tableColHeader, styles.colDesc]}>
              <Text style={styles.tableCellHeader}>Description</Text>
            </View>
            <View style={[styles.tableColHeader, styles.colQty]}>
              <Text style={styles.tableCellHeader}>Qté</Text>
            </View>
            <View style={[styles.tableColHeader, styles.colPU]}>
              <Text style={styles.tableCellHeader}>PU HT</Text>
            </View>
            <View style={[styles.tableColHeader, styles.colTotal]}>
              <Text style={styles.tableCellHeader}>Total HT</Text>
            </View>
          </View>

          {quote.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={[styles.tableCol, styles.colNum]}>
                <Text style={styles.tableCell}>{index + 1}</Text>
              </View>
              <View style={[styles.tableCol, styles.colDesc]}>
                <Text style={styles.tableCell}>
                  Plan Vasque Sur Mesure {"\n"}
                  Dimensions : {item.length} x {item.width} mm {"\n"}
                  {item.sinks && item.sinks.length > 0 && item.sinks[0]?.type !== "Aucune cuve"
                    ? `+ ${item.sinks.filter(s=>s.type!=="Aucune cuve").length} découpe(s) cuve`
                    : ""}
                </Text>
              </View>
              <View style={[styles.tableCol, styles.colQty]}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
              <View style={[styles.tableCol, styles.colPU]}>
                <Text style={styles.tableCell}>{item.unitPrice.toFixed(2)} €</Text>
              </View>
              <View style={[styles.tableCol, styles.colTotal]}>
                <Text style={styles.tableCell}>{(item.unitPrice * item.quantity).toFixed(2)} €</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalsContainer}>
          <View style={styles.totalRow}>
            <Text style={styles.bold}>Total HT :</Text>
            <Text style={styles.bold}>{quote.totalAmount.toFixed(2)} €</Text>
          </View>
        </View>

        <View style={styles.conditionsBox}>
          <Text style={styles.bold}>Conditions de facturation & production :</Text>
          <Text>
            - La commande sera considérée comme ferme et définitive à réception du paiement intégral.{"\n"}
            - La mise en production et l'expédition de vos produits sur-mesure ne seront déclenchées qu'après réception de ce règlement.{"\n"}
            - Vous pouvez convertir ce devis en commande directement depuis votre espace personnel sur notre site internet.
          </Text>
        </View>
      </Page>
    </Document>
  );
};

export default QuoteNote;