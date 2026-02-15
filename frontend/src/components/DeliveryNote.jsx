import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { logoBase64 } from '../assets/logoData';

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: 'Helvetica', lineHeight: 1.5 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  infoContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 40 },
  sellerBlock: { width: '45%' },
  clientBlock: { width: '45%', textAlign: 'right' },
  companyTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 5, marginTop: 5 },
  bold: { fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  docTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', marginBottom: 20 },
  introText: { marginBottom: 20 },
  table: { display: "table", width: "auto", borderStyle: "solid", borderWidth: 1, borderColor: '#000', borderRightWidth: 0, borderBottomWidth: 0 },
  tableRow: { margin: "auto", flexDirection: "row" },
  tableColHeader: { width: "15%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f0f0' },
  tableColHeaderDesc: { width: "70%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f0f0' },
  tableColHeaderQty: { width: "15%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0, backgroundColor: '#f0f0f0' },
  tableCol: { width: "15%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableColDesc: { width: "70%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableColQty: { width: "15%", borderStyle: "solid", borderWidth: 1, borderLeftWidth: 0, borderTopWidth: 0 },
  tableCellHeader: { margin: 5, fontSize: 10, fontWeight: 'bold', fontFamily: 'Helvetica-Bold' },
  tableCell: { margin: 5, fontSize: 10 },
  footer: { marginTop: 50 },
  signatureLine: { marginTop: 40, borderBottomWidth: 1, borderBottomColor: '#000', width: '50%' }
});

const DeliveryNote = ({ order }) => {
  const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
  const today = new Date().toLocaleDateString('fr-FR', dateOptions);

  // CRÉATION DE L'URL ABSOLUE
  // window.location.origin donne "http://localhost:5173" (ou votre domaine en prod)
  // On ajoute le nom du fichier qui est dans "public"
  const logoUrl = window.location.origin + '/logo_guegan.png';

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* EN-TÊTE */}
        <View style={styles.header}>
            <View>
                <Image src={logoBase64} style={{ width: 75 }} />
                <Text style={styles.companyTitle}>Etablissements GUEGAN</Text>
            </View>
        </View>

        {/* ... LE RESTE NE CHANGE PAS ... */}
        <View style={styles.infoContainer}>
            <View style={styles.sellerBlock}>
                <Text style={styles.bold}>Expéditeur :</Text>
                <Text>Etablissements GUEGAN</Text>
                <Text>1 Rue de l'Industrie</Text>
                <Text>93000 Bobigny</Text>
                <Text>Tél : 01 48 40 05 05</Text>
                <Text>Email : contact@etsguegan.com</Text>
            </View>

            <View style={styles.clientBlock}>
                <Text style={styles.bold}>Destinataire :</Text>
                <Text>{order.shippingAddress?.company || order.billingAddress?.company ||  "Société"}</Text>
                <Text>{order.shippingAddress?.firstName || order.billingAddress?.firstName} {order.shippingAddress?.lastName || order.billingAddress?.lastName}</Text>
                <Text>{order.shippingAddress?.address || order.billingAddress?.address}</Text>
                <Text>{order.shippingAddress?.zipCode || order.billingAddress?.zipCode} {order.shippingAddress?.city || order.billingAddress?.city}</Text>
                <Text>Tél : {order.userId?.phone}</Text>
                <Text>Email : {order.userId?.email}</Text>
            </View>
        </View>

        <Text style={styles.docTitle}>Bon de livraison N° {order.orderNumber}</Text>
        <Text style={{marginBottom: 5}}>Date : {today}</Text>

        <Text style={styles.introText}>
          Madame, Monsieur,{'\n\n'}
          Nous vous remercions de votre confiance. En accord avec votre commande, veuillez trouver les articles suivants :
        </Text>

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableColHeader}><Text style={styles.tableCellHeader}>Article</Text></View>
            <View style={styles.tableColHeaderDesc}><Text style={styles.tableCellHeader}>Description</Text></View>
            <View style={styles.tableColHeaderQty}><Text style={styles.tableCellHeader}>Quantité</Text></View>
          </View>

          {order.items.map((item, index) => (
            <View style={styles.tableRow} key={index}>
              <View style={styles.tableCol}>
                <Text style={styles.tableCell}>{index + 1}.</Text>
              </View>
              <View style={styles.tableColDesc}>
                <Text style={styles.tableCell}>
                  Plan de travail {item.material || ''} {'\n'}
                  Dimensions : {item.length} x {item.width} mm {'\n'}
                  {item.sinks && item.sinks.length > 0 && item.sinks[0]?.type !== "Aucune cuve" ? `+ ${item.sinks.length} découpe(s) cuve` : ''}
                </Text>
              </View>
              <View style={styles.tableColQty}>
                <Text style={styles.tableCell}>{item.quantity}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.footer}>
          <Text>Bonne réception de la commande :</Text>
          <View style={styles.signatureLine}></View>
          <Text style={{fontSize: 9, marginTop: 5}}>Date et signature</Text>
        </View>

      </Page>
    </Document>
  );
};

export default DeliveryNote;