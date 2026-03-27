export default function UserAvatar({ user, className = '', style = {}, textStyle = {}, ...props }) {
  const initial = user?.name?.charAt(0)?.toUpperCase() || '?'
  const avatar = user?.avatar

  return (
    <div className={className} style={{ overflow: 'hidden', ...style }} {...props}>
      {avatar ? (
        <img
          src={avatar}
          alt={user?.name || 'User avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      ) : (
        <span style={textStyle}>{initial}</span>
      )}
    </div>
  )
}
