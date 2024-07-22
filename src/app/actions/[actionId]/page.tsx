'use client'

import React, { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';
import { CalendarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../../store';
import { updateBulkAction, setBulkActions } from '../../../../store/features/bulk-actions/bulkActionSlice';
import Pusher from 'pusher-js';
import { IBulkAction } from '@/app/interface';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { LogStatus } from '@/app/ActionListEnum';
import { Input, Tabs } from 'antd';

const { Search } = Input;
const { TabPane } = Tabs;

const ActionDetails: React.FC = () => {
    const dispatch = useDispatch();
    const params = useParams();
    const actionId = params.actionId as string;
    const actionDetails = useSelector((state: RootState) =>
        state.bulkActions.bulkActions.find(action => action.actionId === actionId)
    );
    const allActions = useSelector((state: RootState) => state.bulkActions.bulkActions);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rowData, setRowData] = useState<any[]>([]);
    const [filteredRowData, setFilteredRowData] = useState<any[]>([]);

    const columnDefs = useMemo(() => [
        // { headerName: 'Action ID', field: 'action_id', sortable: true, filter: true, flex: 1 },
        { headerName: 'Identifier', field: 'identifier', sortable: true, filter: true, flex: 1 },
        {
            headerName: 'Status',
            field: 'status',
            sortable: true,
            filter: true,
            cellRenderer: (params: any) => {
                const status = params.value;
                const getStatusColor = (status: LogStatus) => {
                    switch (status) {
                        case LogStatus.queued: return 'bg-yellow-100 text-yellow-800';
                        case LogStatus.skipped: return 'bg-green-100 text-green-800';
                        case LogStatus.failed: return 'bg-red-100 text-red-800';
                        default: return 'bg-gray-100 text-gray-800';
                    }
                };
                return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                        {status}
                    </span>
                );
            }
        },
        { headerName: 'Created At', field: 'created_at', sortable: true, filter: true },
    ], []);

    useEffect(() => {
        const fetchActionDetails = async () => {
            try {
                const response = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/bulk-action/${actionId}`);
                const fetchedAction = response.data;
                dispatch(updateBulkAction(fetchedAction));

                if (allActions.length === 0) {
                    dispatch(setBulkActions([fetchedAction]));
                }

                setLoading(false);
            } catch (err) {
                setError('Failed to fetch action details');
                setLoading(false);
            }
        };

        fetchActionDetails();

        const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
            cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!
        });

        const channel = pusher.subscribe('bulk-action');
        channel.bind('bulk-action-updated', (data: { bulkAction: IBulkAction }) => {
            if (data.bulkAction.actionId === actionId) {
                dispatch(updateBulkAction(data.bulkAction));
            }
        });

        const eventSource = new EventSource(`${process.env.NEXT_PUBLIC_BACKEND_URL}/logging/${actionId}/logs`);

        eventSource.onmessage = (event) => {
            const logData = JSON.parse(event.data);
            setRowData((prevData) => {
                const newData = [...prevData, logData];
                setFilteredRowData(newData);
                return newData;
            });
        };

        eventSource.onerror = (error) => {
            eventSource.close();
        };

        return () => {
            channel.unbind_all();
            channel.unsubscribe();
            eventSource.close();
        };
    }, [actionId, dispatch]);

    const onSearch = (value: string) => {
        const filtered = rowData.filter(row =>
            row.identifier.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredRowData(filtered);
    };

    const onTabChange = (key: string) => {
        if (key === 'all') {
            setFilteredRowData(rowData);
        } else {
            const filtered = rowData.filter(row => row.status === key);
            setFilteredRowData(filtered);
        }
    };

    if (loading) return <div className="text-center py-8">Loading...</div>;
    if (error) return <div className="text-center py-8 text-red-500">{error}</div>;
    if (!actionDetails) return <div className="text-center py-8">No action details found</div>;

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in_progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'scheduled': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    return (
        <div className="bg-white [box-shadow:0_0_0_1px_rgba(0,0,0,.03),0_2px_4px_rgba(0,0,0,.05),0_12px_24px_rgba(0,0,0,.05)] rounded-lg p-6 mx-auto mt-8 w-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Action Details</h1>
                <div className="flex space-x-4">
                    <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800 flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-1" />
                        {new Date(actionDetails.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm ${getStatusColor(actionDetails.status)}`}>
                        {actionDetails.status}
                    </span>
                </div>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
                <DetailItem
                    label="Action ID"
                    value={
                        <div
                            className="text-sm bg-gray-100 p-1 rounded cursor-pointer"
                            onClick={() => copyToClipboard(actionDetails.actionId)}
                            title="Click to copy"
                        >
                            {actionDetails.actionId}
                        </div>
                    }
                />
                <DetailItem label="Total Records" value={actionDetails.totalRecords} />
                <DetailItem label="Is Scheduled" value={actionDetails.isScheduled ? 'Yes' : 'No'} />
                <DetailItem
                    label="Scheduled Time"
                    value={
                        actionDetails.scheduledTime ? (
                            <span className="flex items-center">
                                <ClockIcon className="w-4 h-4 mr-1" />
                                {formatDate(actionDetails.scheduledTime)}
                            </span>
                        ) : 'N/A'
                    }
                />
                <DetailItem label="Action Type" value={actionDetails.actionType} />
                <DetailItem label="Entity" value={actionDetails.entity} />
                <DetailItem
                    label="Skipped Count"
                    value={
                        <span className="text-amber-700 font-bold">
                            {actionDetails.skippedCount ?? 'N/A'}
                        </span>
                    }
                />
                <DetailItem
                    label="Failed Count"
                    value={
                        <span className="text-rose-400 font-bold">
                            {actionDetails.failedCount ?? 'N/A'}
                        </span>
                    }
                />
                <DetailItem
                    label="Success Count"
                    value={
                        <span className="text-emerald-700 font-bold">
                            {actionDetails.successCount ?? 'N/A'}
                        </span>
                    }
                />
            </div>
            <div className="flex justify-between mb-0">
                <Search
                    placeholder="Search by Idnetifier"
                    onSearch={onSearch}
                    style={{ width: 300 }}
                />
                <Tabs defaultActiveKey="all" onChange={onTabChange}>
                    <TabPane tab="All" key="all" />
                    <TabPane tab="Queued" key={LogStatus.queued} />
                    <TabPane tab="Skipped" key={LogStatus.skipped} />
                    <TabPane tab="Failed" key={LogStatus.failed} />
                </Tabs>
            </div>
            <div className="ag-theme-alpine" style={{ height: 400, width: '100%' }}>
                <AgGridReact
                    columnDefs={columnDefs}
                    rowData={filteredRowData}
                    animateRows={true}
                    rowSelection='multiple'
                    enableRangeSelection={true}
                    enableCellTextSelection={true}
                    suppressRowClickSelection={true}
                />
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
    <div className="mb-2">
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-base">{value}</p>
    </div>
);

export default ActionDetails;
