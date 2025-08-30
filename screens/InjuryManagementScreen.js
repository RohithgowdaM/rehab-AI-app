import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
    View,
    Text,
    Button,
    FlatList,
    TouchableOpacity,
    Alert,
    StyleSheet,
    Modal,
    Platform,
    ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../utils/supabase';

const predefinedInjuryTypes = [
    'ACL Tear',
    'Shoulder Dislocation',
    'Ankle Sprain',
    'Hamstring Pull',
    'Fracture',
    'Tennis Elbow',
];

export default function InjuryManagementScreen() {
    const [injuries, setInjuries] = useState([]);
    const [loading, setLoading] = useState(true); // ✅ loading state
    const [modalVisible, setModalVisible] = useState(false);
    const [newType, setNewType] = useState(predefinedInjuryTypes[0]);
    const [newDate, setNewDate] = useState(new Date());
    const [datePickerOpen, setDatePickerOpen] = useState(false);
    const navigation = useNavigation();

    useEffect(() => {
        fetchInjuries();
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            headerRight: () => (
                <Button
                    onPress={async () => {
                        await supabase.auth.signOut();
                        navigation.replace('Login');
                    }}
                    title="Logout"
                    color="red"
                />
            ),
        });
    }, [navigation]);

    const fetchInjuries = async () => {
        setLoading(true); // start spinner
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
            Alert.alert('Auth Error', 'User not authenticated.');
            setLoading(false);
            return;
        }

        const { data, error } = await supabase
            .from('injuries')
            .select('*')
            .eq('user_id', user.id)
            .order('start_date', { ascending: false });

        if (error) {
            Alert.alert('Error', 'Failed to fetch injuries: ' + error.message);
        } else {
            setInjuries(data);
        }
        setLoading(false); // stop spinner
    };

    const handleSetActive = async (injuryId) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase
            .from('injuries')
            .update({ is_active: false })
            .eq('user_id', user.id);

        const { error } = await supabase
            .from('injuries')
            .update({ is_active: true })
            .eq('id', injuryId);

        if (error) {
            Alert.alert('Error', 'Could not activate injury.');
        } else {
            navigation.navigate('Dashboard', { injuryId });
        }
    };

    const handleCloseInjury = async (injuryId) => {
        const { error } = await supabase
            .from('injuries')
            .update({ is_active: false })
            .eq('id', injuryId);

        if (error) {
            Alert.alert('Error', 'Could not close injury.');
        } else {
            fetchInjuries();
        }
    };

    const addNewInjury = async () => {
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('injuries').insert({
            user_id: user.id,
            injury_type: newType,
            start_date: newDate.toISOString(),
            is_active: false,
        });

        if (error) {
            Alert.alert('Error', 'Failed to add injury: ' + error.message);
        } else {
            setModalVisible(false);
            fetchInjuries();
        }
    };

    const renderInjuryItem = ({ item }) => (
        <View style={styles.injuryBox}>
            <Text style={styles.injuryText}>Type: {item.injury_type}</Text>
            <Text style={styles.injuryText}>
                Start: {new Date(item.start_date).toDateString()}
            </Text>
            {item.is_active ? (
                <TouchableOpacity
                    style={styles.activeBadgeContainer}
                    onPress={() => navigation.navigate('Dashboard', { injuryId: item.id })}
                >
                    <Text style={[styles.activeBadgeText, { color: 'green' }]}>
                        Active - Click here to view injury Dashboard
                    </Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.buttonRow}>
                    <Button title="Make Active" onPress={() => handleSetActive(item.id)} />
                    <Button title="Mark Healed" onPress={() => handleCloseInjury(item.id)} />
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            {loading ? (
                <View style={styles.loader}>
                    <ActivityIndicator size="large" color="#2196f3" />
                    <Text>Loading injuries...</Text>
                </View>
            ) : (
                <>
                    <Text style={styles.title}>Active Injuries</Text>
                    <FlatList
                        data={injuries.filter((i) => i.is_active)}
                        renderItem={renderInjuryItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={<Text style={styles.empty}>No active injuries</Text>}
                    />

                    <Text style={styles.title}>Healed Injuries</Text>
                    <FlatList
                        data={injuries.filter((i) => !i.is_active)}
                        renderItem={renderInjuryItem}
                        keyExtractor={(item) => item.id}
                        ListEmptyComponent={<Text style={styles.empty}>No healed injuries</Text>}
                    />

                    <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
                        <Text style={styles.addButtonText}>➕ Add New Injury</Text>
                    </TouchableOpacity>
                </>
            )}

            {/* Modal for adding new injury */}
            <Modal visible={modalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <Text style={styles.modalTitle}>New Injury</Text>

                        <Text style={styles.modalLabel}>Injury Type:</Text>
                        <View style={styles.pickerContainer}>
                            <Picker
                                selectedValue={newType}
                                onValueChange={(itemValue) => setNewType(itemValue)}
                            >
                                {predefinedInjuryTypes.map((type) => (
                                    <Picker.Item key={type} label={type} value={type} />
                                ))}
                            </Picker>
                        </View>

                        <Text style={styles.modalLabel}>Start Date:</Text>
                        <TouchableOpacity
                            style={styles.dateButton}
                            onPress={() => setDatePickerOpen(true)}
                        >
                            <Text style={styles.dateText}>{newDate.toDateString()}</Text>
                        </TouchableOpacity>

                        <View style={styles.modalButtons}>
                            <Button title="Add Injury" onPress={addNewInjury} />
                            <Button
                                title="Cancel"
                                color="#999"
                                onPress={() => setModalVisible(false)}
                            />
                        </View>
                    </View>
                </View>
            </Modal>

            {/* DateTimePicker rendered conditionally */}
            {datePickerOpen && (
                <DateTimePicker
                    value={newDate}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={(event, selectedDate) => {
                        setDatePickerOpen(false);
                        if (selectedDate) {
                            setNewDate(selectedDate);
                        }
                    }}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20, backgroundColor: '#fff' },
    loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    title: { fontSize: 18, fontWeight: 'bold', marginTop: 20 },
    injuryBox: {
        padding: 15,
        backgroundColor: '#f5f5f5',
        marginVertical: 10,
        borderRadius: 10,
    },
    injuryText: { fontSize: 16 },
    activeBadgeContainer: {
        marginTop: 10,
        padding: 6,
        backgroundColor: '#e6ffe6',
        borderRadius: 5,
    },
    activeBadgeText: {
        fontWeight: 'bold',
        textAlign: 'center',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
        gap: 10,
    },
    empty: {
        color: '#999',
        fontStyle: 'italic',
        paddingVertical: 10,
    },
    addButton: {
        backgroundColor: '#2196f3',
        padding: 12,
        borderRadius: 10,
        marginTop: 20,
        alignItems: 'center',
    },
    addButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: '#000000aa',
        justifyContent: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 16,
        textAlign: 'center',
    },
    modalLabel: { fontSize: 16, fontWeight: '500', marginBottom: 6 },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 6,
        marginBottom: 10,
        overflow: 'hidden',
    },
    dateButton: {
        backgroundColor: '#eee',
        padding: 10,
        borderRadius: 6,
        alignItems: 'center',
    },
    dateText: { fontSize: 16 },
    modalButtons: { marginTop: 20, gap: 10 },
});
