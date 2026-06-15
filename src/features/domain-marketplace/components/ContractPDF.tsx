import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';

// Define the PDF styles
const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica', fontSize: 11, lineHeight: 1.5 },
  header: { marginBottom: 20, borderBottom: 1, borderColor: '#eee', paddingBottom: 10, flexDirection: 'row', justifyContent: 'space-between' },
  title: { fontSize: 18, fontWeight: 'bold', textTransform: 'uppercase', color: '#111' },
  subtitle: { fontSize: 10, color: '#666' },
  section: { marginBottom: 15 },
  heading: { fontSize: 12, fontWeight: 'bold', marginBottom: 5, marginTop: 10, textTransform: 'uppercase', backgroundColor: '#f5f5f5', padding: 5 },
  row: { flexDirection: 'row', marginBottom: 3 },
  label: { width: 120, fontWeight: 'bold', color: '#444' },
  value: { flex: 1, color: '#000' },
  legalText: { fontSize: 9, color: '#333', textAlign: 'justify', marginBottom: 6 },
  signatureBlock: { marginTop: 40, flexDirection: 'row', justifyContent: 'space-between' },
  sigBox: { width: '45%', borderTop: 1, borderColor: '#333', paddingTop: 10 },
  sigImage: { height: 40, width: 120, alignSelf: 'center' }, 
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 8, textAlign: 'center', color: '#999' }
});

interface ContractProps {
  order: any;
  domain: any;
}

export const ContractDocument = ({ order, domain }: ContractProps) => {
  const isRental = order.selected_option !== 'buy';
  const date = new Date(order.created_at).toLocaleDateString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* HEADER */}
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>UCP MARKETPLACE</Text>
                <Text style={styles.subtitle}>Premium Domain Services</Text>
            </View>
            <View>
                <Text style={{ fontSize: 10 }}>Ref: {order.id?.slice(0, 8).toUpperCase()}</Text>
                <Text style={{ fontSize: 10 }}>Date: {date}</Text>
            </View>
        </View>

        {/* AGREEMENT TITLE */}
        <View style={styles.section}>
            <Text style={{ fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 }}>
                {isRental ? 'DOMAIN LEASE AGREEMENT' : 'DOMAIN SALE & TRANSFER AGREEMENT'}
            </Text>
            <Text style={styles.legalText}>
                This agreement is entered into between UCP MAROC ("Lessor/Seller") and the individual named below ("Lessee/Buyer").
            </Text>
        </View>

        {/* 1. CLIENT INFO */}
        <View style={styles.section}>
            <Text style={styles.heading}>1. Client Information</Text>
            <View style={styles.row}><Text style={styles.label}>Full Name:</Text><Text style={styles.value}>{order.buyer_name}</Text></View>
            <View style={styles.row}><Text style={styles.label}>ID / CIN:</Text><Text style={styles.value}>{order.buyer_cin}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Email:</Text><Text style={styles.value}>{order.buyer_email}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Phone:</Text><Text style={styles.value}>{order.buyer_phone}</Text></View>
        </View>

        {/* 2. ASSET INFO */}
        <View style={styles.section}>
            <Text style={styles.heading}>2. Asset Details</Text>
            <View style={styles.row}><Text style={styles.label}>Domain Name:</Text><Text style={styles.value}>{domain?.name || 'N/A'}</Text></View>
            <View style={styles.row}><Text style={styles.label}>Plan Selected:</Text><Text style={styles.value}>{order.selected_option.toUpperCase().replace('_', ' ')}</Text></View>
            <View style={styles.row}>
                <Text style={styles.label}>Agreed Price:</Text>
                <Text style={styles.value}>
                    {order.selected_option === 'buy' ? `${domain.price_buy} MAD (One-time)` : 
                     order.selected_option === 'rent_deal' ? `${domain.price_rent_deal} MAD/mo (+ Build Fee)` :
                     `${domain.price_rent_standard} MAD/mo`}
                </Text>
            </View>
        </View>

        {/* 3. LEGAL TERMS */}
        <View style={styles.section}>
            <Text style={styles.heading}>3. Terms & Conditions</Text>
            {isRental ? (
                <>
                <Text style={styles.legalText}>3.1. OWNERSHIP: The Lessor (UCP) retains full legal ownership of the Domain Name. The Lessee is granted a license to use the domain so long as monthly payments are current.</Text>
                <Text style={styles.legalText}>3.2. DEFAULT: Failure to pay the monthly rental fee within 7 days of the due date will result in immediate termination of this lease.</Text>
                <Text style={styles.legalText}>3.3. BUYOUT: The Lessee may opt to purchase the domain outright at any time for the difference of the listed Buy Price, subject to Lessor approval.</Text>
                </>
            ) : (
                <Text style={styles.legalText}>3.1. TRANSFER: Upon receipt of full payment, the Seller agrees to unlock the domain and provide the authorization code (EPP) to the Buyer within 48 hours.</Text>
            )}
             <Text style={styles.legalText}>3.4. JURISDICTION: This agreement shall be governed by the laws of the Kingdom of Morocco.</Text>
        </View>

        {/* 4. SIGNATURES */}
        <View style={styles.signatureBlock}>
            <View style={styles.sigBox}>
            <Text style={{ fontSize: 9, marginBottom: 5 }}>For UCP MAROC (Authorized):</Text>
                <Image src="/admin-signature.png" style={styles.sigImage} />
                <Text style={{ fontSize: 10, marginTop: 5 }}>Youssef El Amrani</Text>
                <Text style={{ fontSize: 8, color: '#666' }}>CEO, UCP Maroc</Text>
            </View>

            <View style={styles.sigBox}>
                <Text style={{ fontSize: 9, marginBottom: 5 }}>For {order.buyer_name}:</Text>
                {order.signature_url ? (
                    <Image src={order.signature_url} style={styles.sigImage} />
                ) : (
                    <Text style={{ color: 'red', fontSize: 10 }}>[Signature Missing]</Text>
                )}
            </View>
        </View>

        <Text style={styles.footer}>
            Generated automatically by UCP Platform | Order ID: {order.id}
        </Text>
      </Page>
    </Document>
  );
};
