export const BarraColorida: React.FC = () => {
    return (
        <div style={{position: 'absolute', bottom: 0, left: 0, width: '100%', height: 8, display: 'flex'}}>
            <div style={{flex: 1, backgroundColor: '#008acb', borderRadius: '0 0 0 6px'}} />
            <div style={{flex: 1, backgroundColor: '#7bb52c'}} />
            <div style={{flex: 1, backgroundColor: '#ffb400', borderRadius: '0 0 6px 0'}} />
        </div>
    )
}
